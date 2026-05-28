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

MODEL_ID = "stabilityai/sdxl-turbo"
MODEL_DIR = "/vol/sdxl-turbo"
SAFETY_MODEL_ID = "CompVis/stable-diffusion-safety-checker"
SAFETY_FEATURE_EXTRACTOR_ID = "openai/clip-vit-base-patch32"


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

        AutoPipelineForText2Image.from_pretrained(
            MODEL_ID,
            cache_dir=MODEL_DIR,
        )
        CLIPFeatureExtractor.from_pretrained(
            SAFETY_FEATURE_EXTRACTOR_ID,
            cache_dir=MODEL_DIR,
        )
        StableDiffusionSafetyChecker.from_pretrained(
            SAFETY_MODEL_ID,
            cache_dir=MODEL_DIR,
        )
        model_volume.commit()

    @modal.enter()
    def load_models(self):
        import torch
        from diffusers import AutoPipelineForText2Image
        from transformers import CLIPFeatureExtractor
        from diffusers.pipelines.stable_diffusion import StableDiffusionSafetyChecker

        self.pipe = AutoPipelineForText2Image.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16,
            variant="fp16",
            cache_dir=MODEL_DIR,
        ).to("cuda")

        self.feature_extractor = CLIPFeatureExtractor.from_pretrained(
            SAFETY_FEATURE_EXTRACTOR_ID,
            cache_dir=MODEL_DIR,
        )
        self.safety_checker = StableDiffusionSafetyChecker.from_pretrained(
            SAFETY_MODEL_ID,
            cache_dir=MODEL_DIR,
        ).to("cuda")

    def _check_safety(self, image):
        import torch
        import numpy as np

        safety_input = self.feature_extractor(images=image, return_tensors="pt").to("cuda")
        _, has_nsfw = self.safety_checker(
            images=[np.array(image)],
            clip_input=safety_input.pixel_values.to(torch.float16),
        )
        return has_nsfw[0]

    @modal.web_endpoint(method="POST")
    def generate(self, body: dict) -> dict:
        prompt = (body.get("prompt") or "").strip()
        if not prompt:
            return {"error": "prompt is required"}, 400

        image = self.pipe(
            prompt=prompt,
            num_inference_steps=4,
            guidance_scale=0.0,
        ).images[0]

        if self._check_safety(image):
            return {"error": "Prompt produced unsafe content and was rejected"}, 400

        buf = io.BytesIO()
        image.save(buf, format="PNG")
        encoded = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {"image": encoded, "format": "png"}
