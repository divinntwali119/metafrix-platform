from rest_framework import serializers

class TextFileSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    
class TreeSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    path = serializers.CharField(required=True)
    type = serializers.CharField(required=True)
    size = serializers.IntegerField()
    lastCommitMessage = serializers.CharField()
    lastCommitDate = serializers.DateTimeField()