from rest_framework import serializers
from apps.collaborations.models import (
    Organisation,
    Team,
    Member,
    Invitation,
    Board,
    Attachment,
    Comment,
    Note,
    ToDoList,
    Task
)

# Organisation serializer
class OrganisationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    createdBy = serializers.StringRelatedField(source='created_by')
    imageProfile = serializers.ImageField(source='image_profile', allow_null=True, required=False)
    
    class Meta:
        model = Organisation
        fields = ['slug', 'name', 'imageProfile', 'createdAt', 'createdBy']
        read_only_fields = ['slug', 'createdAt', 'createdBy']

# Team serializer
class TeamSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    createdBy = serializers.StringRelatedField(source='created_by')
    imageProfile = serializers.ImageField(source='image_profile', allow_null=True, required=False)

    class Meta:
        model = Team
        fields = ['slug', 'name', 'imageProfile', 'createdAt', 'createdBy']
        read_only_fields = ['slug', 'createdAt', 'createdBy']
        
        
# Member serializer
class MemberSerializer(serializers.ModelSerializer):
    joinedAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    
    class Meta:
        model = Member
        fields = ['slug', 'user', 'team', 'role', 'joinedAt', 'tag']
        read_only_fields = ['slug', 'user', 'team', 'role', 'joinedAt']
        

# Invitation serializer
class InvitationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    toUser = serializers.StringRelatedField(source='to_user')
    
    class Meta:
        model = Invitation
        fields = ['slug', 'repo', 'toUser', 'accepted', 'createdAt']
        read_only_fields = ['slug', 'repo', 'toUser', 'accepted', 'createdAt']
        

# Board serializer
class BoardSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M')

    class Meta:
        model = Board
        fields = ['slug', 'repo', 'name', 'team', 'createdAt', 'updatedAt']
        read_only_fields = ['slug' 'team', 'repo', 'createdAt', 'updatedAt']
        
# Attachment serializer
class AttachemntSerializer(serializers.ModelSerializer):
    uploadedAt = serializers.DateTimeField(source='uploaded_at', format='%Y-%m-%d %H:%M')
    uploadedBy = serializers.StringRelatedField(source='uploaded_by')
    
    class Meta:
        model = Attachment
        fields = ['slug', 'file', 'uploadedAt', 'uploadedBy']
        read_only_fields = '__all__'

# Comment serializer
class CommentSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    
    class Meta:
        model = Comment
        fields = ['author', 'createdAt', 'content']
        read_only_fields = ['createdAt', 'author']
        
# Note serializer
class NoteSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M')
    
    class Meta:
        model = Note
        fields = ['title', 'description', 'author', 'createdAt', 'updatedAt', 'color']
        read_only_fields = ['author', 'createdAt', 'updatedAt']
        

# Task serializer
class TaskSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')

    class Meta:
        model = Task
        fields = ['slug', 'title', 'description', 'createdAt', 'completed']
        read_only_fields = ['slug', 'createdAt']
        
    
# ToDolist serializer
class ToDoListSerializer(serializers.ModelSerializer):
    assignedTo = serializers.StringRelatedField(source='assigned_to')
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M')
    
    class Meta:
        model = ToDoList
        fields = ['slug', 'assignedTo', 'createdAt', 'updatedAt', 'description', 'completed']
        read_only_fields = ['slug', 'createdAt', 'updatedAt']