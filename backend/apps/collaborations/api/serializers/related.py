from rest_framework import serializers
from ...models import Organisation, Team

class OrganisationSummarySerializer(serializers.ModelSerializer):
    imageProfile = serializers.ImageField(source='image_profile')
    class Meta:
        model = Organisation
        fields = ['name', 'slug', 'imageProfile']


class TeamSummarySerializer(serializers.ModelSerializer):
    imageProfile = serializers.ImageField(source='image_profile')
    
    class Meta:
        model = Team
        fields = ['imageProfile', 'name']