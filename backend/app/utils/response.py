from flask import jsonify

def success_response(data=None, message="Success", status_code=200, **kwargs):
    """
    Standardize success responses
    """
    response = {
        "success": True,
        "status": "COMPLETED",
        "message": message
    }
    if data is not None:
        response["data"] = data
        
    for key, value in kwargs.items():
        response[key] = value
        
    return jsonify(response), status_code

def error_response(error_message="An error occurred", status_code=500, error_code="INTERNAL_ERROR", **kwargs):
    """
    Standardize error responses
    """
    response = {
        "success": False,
        "status": "FAILED",
        "error": error_message,
        "error_code": error_code
    }
    for key, value in kwargs.items():
        response[key] = value

    return jsonify(response), status_code
