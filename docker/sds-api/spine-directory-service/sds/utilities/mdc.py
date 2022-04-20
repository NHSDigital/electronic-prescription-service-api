import contextvars

correlation_id: contextvars.ContextVar[str] = contextvars.ContextVar('correlation_id', default='')
trace_id: contextvars.ContextVar[str] = contextvars.ContextVar('trace_id', default='')
