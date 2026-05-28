"""
Run with: modal run modal_app/hello_gpu.py
Confirms GPU access and CUDA availability before deploying the full app.
"""
import modal

app = modal.App("hello-gpu")


@app.function(gpu="A10G")
def hello_gpu():
    import subprocess
    result = subprocess.run(["nvidia-smi"], capture_output=True, text=True)
    print(result.stdout)

    import torch
    print(f"CUDA available: {torch.cuda.is_available()}")
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    return "GPU check passed"


@app.local_entrypoint()
def main():
    result = hello_gpu.remote()
    print(result)
