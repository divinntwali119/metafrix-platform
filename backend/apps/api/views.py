from django.db import connections
from django.db.utils import DatabaseError
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
	permission_classes = [AllowAny]
	authentication_classes = []
	throttle_classes = []

	def get(self, request):
		try:
			with connections["default"].cursor() as cursor:
				cursor.execute("SELECT 1")
				cursor.fetchone()
		except DatabaseError:
			return Response({"status": "unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
		return Response({"status": "ok"})
