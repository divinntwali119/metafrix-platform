from rest_framework.routers import DefaultRouter

from .viewsets.organisation import (
    OrganisationMembershipViewSet,
    OrganisationRepositoryViewSet,
    OrganisationViewSet,
)
from .viewsets.team import (
    AttachmentViewSet,
    BoardViewSet,
    NoteViewSet,
    TaskViewSet,
    TeamViewSet,
    ToDoListViewSet,
)


class OrganisationMembershipRouterViewSet(OrganisationMembershipViewSet):
    lookup_url_kwarg = 'user_id'
    lookup_value_regex = '[0-9]+'


class OrganisationRepositoryRouterViewSet(OrganisationRepositoryViewSet):
    lookup_url_kwarg = 'repository_id'
    lookup_value_regex = '[0-9]+'


class OrganisationDefaultRouter(DefaultRouter):
    def get_routes(self, viewset) -> list:
        routes = super().get_routes(viewset)
        if issubclass(viewset, OrganisationMembershipRouterViewSet):
            list_route_index = next(
                index
                for index, route in enumerate(routes)
                if route.name == '{basename}-list'
            )
            list_route = routes[list_route_index]
            routes[list_route_index] = list_route._replace(
                mapping={**list_route.mapping, 'delete': 'destroy'}
            )
        return routes


router = OrganisationDefaultRouter()
router.register('organizations', OrganisationViewSet, basename='organisation')
router.register(
    r'organizations/(?P<slug>[^/.]+)/members',
    OrganisationMembershipRouterViewSet,
    basename='organisation-members',
)
router.register(
    r'organizations/(?P<slug>[^/.]+)/repositories',
    OrganisationRepositoryRouterViewSet,
    basename='organisation-repositories',
)
router.register('teams', TeamViewSet, basename='team')
router.register('boards', BoardViewSet, basename='board')
router.register('notes', NoteViewSet, basename='note')
router.register('attachments', AttachmentViewSet, basename='attachment')
router.register('todo-lists', ToDoListViewSet, basename='todo-list')
router.register('tasks', TaskViewSet, basename='task')

app_name = 'collaborations'
urlpatterns = router.urls
