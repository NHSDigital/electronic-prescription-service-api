import pytest

from unittest.mock import Mock


@pytest.fixture
def lambda_context():
    context = Mock()
    context.function_name = "test-function"
    context.aws_request_id = "test-request-id"
    return context
