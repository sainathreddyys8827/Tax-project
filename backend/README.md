# Taxwise AI - Flask Backend

Production-ready modular Flask backend for Personal Wealth Tax-Saver Agent.

## Overview

This is a comprehensive Flask backend application that helps users:
- Upload and analyze bank statements (CSV)
- Categorize transactions automatically
- Calculate Indian income tax deductions (80C, 80D, HRA)
- Generate tax optimization recommendations using OpenAI
- Track financial data in MongoDB

## Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── error_handlers.py        # Global error handling
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py          # Configuration management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── db_models.py         # Data models
│   │   └── database.py          # MongoDB connection
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health_routes.py     # Health check endpoints
│   │   ├── user_routes.py       # User management
│   │   ├── upload_routes.py     # CSV file upload
│   │   ├── tax_routes.py        # Tax analysis
│   │   ├── transaction_routes.py # Transaction data
│   │   └── recommendations_routes.py # AI recommendations
│   ├── services/
│   │   ├── __init__.py
│   │   ├── data_processing_service.py   # CSV processing & cleaning
│   │   ├── categorization_service.py    # Transaction categorization
│   │   ├── tax_calculator_service.py    # Tax calculations
│   │   ├── openai_service.py           # OpenAI integration
│   │   └── file_upload_service.py      # File management
│   └── utils/
│       ├── __init__.py
│       ├── logger.py            # Logging setup
│       ├── errors.py            # Custom exceptions
│       └── validators.py        # Input validation
├── uploads/                     # Uploaded files storage
├── logs/                        # Application logs
├── .env.example                 # Environment variables template
├── .gitignore
├── requirements.txt             # Python dependencies
├── run.py                       # Application entry point
├── wsgi.py                      # WSGI entry point (production)
└── README.md
```

## Key Features

### 1. **File Upload & Processing**
- CSV bank statement upload
- Automatic data cleaning with pandas
- Duplicate detection and removal
- Date and amount validation

### 2. **Transaction Categorization**
- Rule-based automatic categorization
- 10+ predefined categories
- Keywords and pattern matching
- Category breakdown and statistics

### 3. **Tax Analysis**
- Section 80C deductions (Life Insurance, PPF, ELSS)
- Section 80D deductions (Medical Insurance)
- HRA calculation and tracking
- Section 80G donations tracking
- Tax slab calculation with cess
- Effective tax rate computation

### 4. **AI Recommendations**
- OpenAI ChatGPT integration
- Personalized tax optimization tips
- Financial insight generation
- Fallback basic recommendations

### 5. **Data Management**
- MongoDB database integration
- Indexed collections for performance
- Transaction history tracking
- User profile management
- Analysis history storage

## Setup & Installation

### Prerequisites
- Python 3.8+
- MongoDB 4.0+
- OpenAI API key

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set:
```
FLASK_ENV=development
MONGODB_URI=mongodb://localhost:27017
DB_NAME=taxwise_db
OPENAI_API_KEY=your-openai-api-key
SECRET_KEY=your-secret-key
```

### 3. Run Application

**Development:**
```bash
python run.py
```

**Production (with Gunicorn):**
```bash
gunicorn wsgi:app
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /api/health` - Server health status
- `GET /api/health/ready` - Readiness probe

### Users
- `POST /api/users` - Create user
- `GET /api/users/<user_id>` - Get user details
- `PUT /api/users/<user_id>` - Update user

### File Upload
- `POST /api/uploads/csv` - Upload CSV file
- `GET /api/uploads/<upload_id>` - Get upload status

### Tax Analysis
- `GET /api/tax/analyze/<user_id>` - Analyze user taxes
- `GET /api/tax/analysis/<analysis_id>` - Get specific analysis
- `GET /api/tax/user/<user_id>/analyses` - Get user's analyses

### Transactions
- `GET /api/transactions/user/<user_id>` - Get user transactions
- `GET /api/transactions/user/<user_id>/by-category` - Transactions by category
- `GET /api/transactions/<transaction_id>` - Get specific transaction
- `PUT /api/transactions/<transaction_id>` - Update transaction

### Recommendations
- `GET /api/recommendations/tax-optimization/<user_id>` - Get tax recommendations
- `GET /api/recommendations/financial-insights/<user_id>` - Get financial insights

## Example Workflows

### 1. Create User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "pan": "AAAPB1234C",
    "name": "John Doe",
    "financial_year": "2023-24"
  }'
```

### 2. Upload CSV File
```bash
curl -X POST http://localhost:5000/api/uploads/csv \
  -F "file=@bank_statement.csv" \
  -F "user_id=<user_id>" \
  -F "financial_year=2023-24"
```

### 3. Analyze Taxes
```bash
curl http://localhost:5000/api/tax/analyze/<user_id>?financial_year=2023-24
```

### 4. Get Recommendations
```bash
curl http://localhost:5000/api/recommendations/tax-optimization/<user_id>
```

## Database Schema

### Users Collection
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "pan": "AAAPB1234C",
  "name": "John Doe",
  "financial_year": "2023-24",
  "is_active": true,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### Transactions Collection
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "date": ISODate,
  "description": "Transaction description",
  "amount": 5000.00,
  "category": "SALARY",
  "transaction_type": "CREDIT",
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### Tax Analysis Collection
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "financial_year": "2023-24",
  "total_income": 500000.00,
  "taxable_income": 350000.00,
  "estimated_tax": 35000.00,
  "section_80c_eligible": 150000.00,
  "section_80d_eligible": 50000.00,
  "hra_eligible": 120000.00,
  "donation_eligible": 10000.00,
  "recommendations": [],
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## Error Handling

The application implements comprehensive error handling:

- **ValidationError** (400) - Input validation failures
- **FileUploadError** (400) - File upload issues
- **DataProcessingError** (422) - Data processing failures
- **TaxCalculationError** (422) - Tax calculation issues
- **DatabaseError** (500) - Database connection/operation errors
- **OpenAIError** (502) - OpenAI API failures
- **NotFoundError** (404) - Resource not found

All errors return JSON with error code and message:
```json
{
  "error": "Error message",
  "error_code": "ERROR_CODE"
}
```

## Logging

Structured logging with:
- Console output (formatted)
- Daily rotating file logs
- Error and info level separation
- Logs stored in `logs/` directory

## Testing

Run tests with:
```bash
pytest
```

## Deployment

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:5000"]
```

### Environment Variables (Production)
- Set `FLASK_ENV=production`
- Set `DEBUG=False`
- Use strong `SECRET_KEY`
- Configure `MONGODB_URI` for production database
- Set OpenAI API key securely

## Security Notes

1. Never commit `.env` file with sensitive keys
2. Use environment variables for all secrets
3. Validate all user input
4. Implement API authentication (add JWT middleware)
5. Use HTTPS in production
6. Set appropriate CORS origins
7. Rate limit API endpoints
8. Sanitize file uploads

## Future Enhancements

- [ ] JWT authentication
- [ ] Rate limiting
- [ ] Caching layer (Redis)
- [ ] Advanced analytics
- [ ] Export to PDF reports
- [ ] Multi-user collaboration
- [ ] Mobile app APIs
- [ ] Integration with tax filing portals
- [ ] Real-time notifications

## License

ISC

## Support

For issues or questions, contact the development team.
