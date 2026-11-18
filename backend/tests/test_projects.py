"""ResearchMeta AI - Project Management and User Isolation Tests"""
import pytest
from fastapi import HTTPException
from app.api.routes.projects import (
    create_project,
    list_user_projects,
    get_project,
    update_project,
    delete_project
)
from app.schemas.project import ProjectCreate, ProjectUpdate

def test_create_and_list_project(db_session, test_user):
    """Test creating a project and retrieving project list."""
    payload = ProjectCreate(
        title="Quantum Computing in Post-Quantum Cryptography",
        description="Exploration of lattice-based algorithms and quantum vulnerability.",
        academic_level="Doctoral",
        research_field="Computer Science",
        status="active"
    )
    created = create_project(payload, db_session, test_user)
    assert created["title"] == payload.title
    assert created["user_id"] == test_user.id

    projects = list_user_projects(db_session, test_user)
    assert len(projects) >= 1
    assert any(p["id"] == created["id"] for p in projects)

def test_user_data_isolation(db_session, test_user, other_user):
    """Verify that User B cannot access or modify User A's project."""
    payload = ProjectCreate(
        title="User A Confidential Research",
        academic_level="Graduate",
        research_field="Biochemistry"
    )
    created = create_project(payload, db_session, test_user)
    project_id = created["id"]

    # User B attempts to access User A's project
    with pytest.raises(HTTPException) as exc_get:
        get_project(project_id, db_session, other_user)
    assert exc_get.value.status_code == 404

    # User B attempts to update User A's project
    update_payload = ProjectUpdate(title="Hacked Title")
    with pytest.raises(HTTPException) as exc_put:
        update_project(project_id, update_payload, db_session, other_user)
    assert exc_put.value.status_code == 404

    # User B attempts to delete User A's project
    with pytest.raises(HTTPException) as exc_del:
        delete_project(project_id, db_session, other_user)
    assert exc_del.value.status_code == 404

    # User B's project list should not contain User A's project
    other_list = list_user_projects(db_session, other_user)
    assert not any(p["id"] == project_id for p in other_list)

def test_update_and_delete_project(db_session, test_user):
    """Test updating and deleting own project."""
    payload = ProjectCreate(title="Original Project Title")
    created = create_project(payload, db_session, test_user)
    project_id = created["id"]

    updated = update_project(project_id, ProjectUpdate(title="Updated Project Title"), db_session, test_user)
    assert updated["title"] == "Updated Project Title"

    del_res = delete_project(project_id, db_session, test_user)
    assert del_res["message"] == "Project deleted successfully"

    with pytest.raises(HTTPException):
        get_project(project_id, db_session, test_user)
