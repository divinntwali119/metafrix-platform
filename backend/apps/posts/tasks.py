from os import path, makedirs
from subprocess import run, PIPE
from celery import shared_task
from django.conf import settings
from .models import Reel

@shared_task
def process_reel_video(reel_id : str) -> None:
    try:
        reel = Reel.objects.get(id=reel_id)
        reel.status = Reel.Status.PROCESSING
        reel.save(update_fields=['status'])
        
        input_path = reel.raw_video.path

        # Define the paths for the raw and processed videos
        output_filename=f'{reel_id}.mp4'
        thumbnail_filename=f'{reel_id}.jpg'
        
        processed_dir = path.join(settings.MEDIA_ROOT, 'reels', 'processed')
        thumbnail_dir = path.join(settings.MEDIA_ROOT, 'reels', 'thumbnails')
        makedirs(processed_dir, exist_ok=True)
        makedirs(thumbnail_dir, exist_ok=True)
        
        output_path = path.join(processed_dir, output_filename)
        thumbnail_path = path.join(thumbnail_dir, thumbnail_filename)
        
        compress_cmd = [
            'ffmpeg',
            '-y',
            '-i',
            input_path,
            '-vf',
            'scale=720:-2',
            '-c:v',
            'libx264',
            '-preset',
            'fast',
            '-crf',
            '28',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            '-movflags',
            '+faststart',
            output_path
        ]
        
        run(compress_cmd, check=True, stdout=PIPE, stderr=PIPE)
        
        # Extract the thumbnail
        thumbnail_cmd = [
            'ffmpeg',
            '-y',
            '-i',
            output_path,
            '-ss',
            '00:00:01.000',
            '-vframes',
            '1',
            '-q:v',
            '2',
            thumbnail_path
        ]
        
        run(thumbnail_cmd, check=True, stdout=PIPE, stderr=PIPE)
    
    except Exception as e:
        reel.status = Reel.Status.FAILED
        reel.save(update_fields=['status'])
        print(f"Error occurred while processing reel {reel_id}: {e}")