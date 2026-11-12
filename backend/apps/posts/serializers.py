from rest_framework import serializers
from .models import Event, Post, Reel

# Event serializer
class EventSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source='start_date', format='%Y-%m-%d', input_formats=['%Y-%m-%d'])
    endDate = serializers.DateField(source='end_date', format='%Y-%m-%d', input_formats=['%Y-%m-%d'])
    
    class Meta:
        model = Event
        fields = ['slug', 'name', 'description', 'image', 'organisator', 'startDate', 'endDate']
        read_only_fields = ['slug', 'organisator']

# Post serializer
class PostSerializer(serializers.ModelSerializer):
    postedAt = serializers.DateTimeField(source='posted_at', format='%Y-%m-%d %H:%M')
    postedBy = serializers.StringRelatedField(source='posted_by', read_only=True)

    class Meta:
        model = Post
        fields = ['slug', 'title', 'description', 'postedBy', 'postedAt', 'postedBy']
        read_only_fields = ['slug', 'postedAt', 'postedBy']

# Reel serializer
class ReelSerializer(serializers.ModelSerializer):
  videoUrl = serializers.FileField(source='processed_video')
  rawVideo = serializers.FileField(write_only=True, source='raw_video')
  createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')

  class Meta:
    model = Reel
    fields = [ 'id', 'author', 'caption', 'videoUrl', 'thumbnail', 'status', 'createdAt', 'rawVideo']
    read_only_fields = ['author', 'thumbnail', 'status', 'createdAt', 'videoUrl']