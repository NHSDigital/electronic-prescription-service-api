from unittest.mock import Mock, patch

import app.handler
from app.handler import handler


def test_handler(lambda_context: Mock):
    with patch.object(app.handler, "logger") as mock_logger:
        event = {}
        response = handler(event, lambda_context)

        args, kwargs = mock_logger.info.call_args

        assert response == {"status": "success"}

        assert mock_logger.info.called
        assert args[0] == "create_prescription handler invoked"
        assert kwargs["event"] == event
        assert kwargs["context"] == lambda_context
