"""FastAPI application entry point for AI-Learning-Agent."""

from __future__ import annotations

import logging
import sys

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api.router import api_router
from backend.api.schemas.common import ErrorResponse
from backend.utils.console import configure_utf8_output


configure_utf8_output(sys.stdout, sys.stderr)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI-Learning-Agent API",
    description="Backend foundation for the AI-powered personal learning agent.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://vidyani-ai-ochre.vercel.app",
    "https://vidyani-8fgf0fc9h-rishabh-devadigas-projects.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming HTTP requests so frontend/backend flow is visible."""

    logger.info("Incoming request: %s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info(
        "Completed request: %s %s -> %s",
        request.method,
        request.url.path,
        response.status_code,
    )
    return response


def _json_safe_validation_errors(exc: RequestValidationError) -> list[dict[str, object]]:
    """Return validation errors without non-serializable exception objects."""

    safe_errors: list[dict[str, object]] = []
    for error in exc.errors():
        safe_error = dict(error)
        context = safe_error.get("ctx")
        if isinstance(context, dict) and "error" in context:
            safe_error["ctx"] = {
                **context,
                "error": str(context["error"]),
            }
        safe_errors.append(safe_error)
    return safe_errors


@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """Return HTTP exceptions using the standard API error envelope."""

    logger.info("HTTP error while processing %s: %s", request.url.path, exc.status_code)
    detail = exc.detail
    if isinstance(detail, dict):
        message = str(detail.get("message", "Request failed."))
        error_code = detail.get("error_code")
        details = detail.get("details")
    else:
        message = str(detail)
        error_code = None
        details = None

    error = ErrorResponse(
        message=message,
        error_code=str(error_code) if error_code is not None else None,
        details=details,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(error),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return request validation errors using the standard API error envelope."""

    logger.info("Validation error while processing %s", request.url.path)
    error = ErrorResponse(
        message="Request validation failed.",
        error_code="validation_error",
        details=_json_safe_validation_errors(exc),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(error),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Log unexpected errors and return a stable API error shape."""

    logger.exception("Unhandled error while processing %s", request.url.path)
    error = ErrorResponse(
        message="Internal server error.",
        error_code="internal_server_error",
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=jsonable_encoder(error),
    )
