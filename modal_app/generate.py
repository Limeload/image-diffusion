import io
import base64
import modal

app = modal.App("image-diffusion")

model_volume = modal.Volume.from_name("sdxl-turbo-weights", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "diffusers==0.31.0",
        "transformers==4.46.3",
        "accelerate==1.1.1",
        "torch==2.5.1",
        "safetensors==0.4.5",
        "Pillow==11.0.0",
    )
)

MODELS = {
    "sdxl-turbo": "stabilityai/sdxl-turbo",
    "sd15":       "runwayml/stable-diffusion-v1-5",
}
MODEL_DIR              = "/vol/models"
SAFETY_MODEL_ID        = "CompVis/stable-diffusion-safety-checker"
SAFETY_FE_ID           = "openai/clip-vit-base-patch32"

ASPECT_SIZES = {
    "square":    (512, 512),
    "landscape": (768, 512),
    "portrait":  (512, 768),
    "wide":      (896, 512),
}


@app.cls(
    gpu="A10G",
    image=image,
    volumes={"/vol": model_volume},
    container_idle_timeout=300,
)
class ImageGenerator:
    @modal.build()
    def download_models(self):
        from diffusers import AutoPipelineForText2Image
        from transformers import CLIPFeatureExtractor
        from diffusers.pipelines.stable_diffusion import StableDiffusionSafetyChecker

        for model_id in MODELS.values():
            AutoPipelineForText2Image.from_pretrained(model_id, cache_dir=MODEL_DIR)
        CLIPFeatureExtractor.from_pretrained(SAFETY_FE_ID, cache_dir=MODEL_DIR)
        StableDiffusionSafetyChecker.from_pretrained(SAFETY_MODEL_ID, cache_dir=MODEL_DIR)
        model_volume.commit()

    @modal.enter()
    def load_models(self):
        import torch
        from diffusers import AutoPipelineForText2Image
        from transformers import CLIPFeatureExtractor
        from diffusers.pipelines.stable_diffusion import StableDiffusionSafetyChecker

        # Pre-load both pipelines
        self.pipes = {
            key: AutoPipelineForText2Image.from_pretrained(
                model_id,
                torch_dtype=torch.float16,
                variant="fp16" if key == "sdxl-turbo" else None,
                cache_dir=MODEL_DIR,
            ).to("cuda")
            for key, model_id in MODELS.items()
        }

        self.feature_extractor = CLIPFeatureExtractor.from_pretrained(SAFETY_FE_ID, cache_dir=MODEL_DIR)
        self.safety_checker = StableDiffusionSafetyChecker.from_pretrained(
            SAFETY_MODEL_ID, cache_dir=MODEL_DIR
        ).to("cuda")

    def _check_safety(self, image):
        import torch, numpy as np
        inp = self.feature_extractor(images=image, return_tensors="pt").to("cuda")
        _, has_nsfw = self.safety_checker(
            images=[np.array(image)],
            clip_input=inp.pixel_values.to(torch.float16),
        )
        return has_nsfw[0]

    @modal.web_endpoint(method="POST")
    def generate(self, body: dict) -> dict:
        prompt  = (body.get("prompt") or "").strip()
        model   = body.get("model", "sdxl-turbo")
        aspect  = body.get("aspect", "square")

        if not prompt:
            return {"error": "prompt is required"}, 400
        if model not in self.pipes:
            model = "sdxl-turbo"

        width, height = ASPECT_SIZES.get(aspect, (512, 512))
        steps  = 4  if model == "sdxl-turbo" else 20
        cfg    = 0.0 if model == "sdxl-turbo" else 7.5

        result = self.pipes[model](
            prompt=prompt,
            num_inference_steps=steps,
            guidance_scale=cfg,
            width=width,
            height=height,
        )
        gen_image = result.images[0]

        if self._check_safety(gen_image):
            return {"error": "Prompt produced unsafe content and was rejected"}, 400

        buf = io.BytesIO()
        gen_image.save(buf, format="PNG")
        encoded = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {"image": encoded, "format": "png", "width": width, "height": height}
