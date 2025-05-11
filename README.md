# Virtual Classroom Backend

## Quick Setup
```bash
# Install dependencies
npm install

# Create .env file with:
PORT=3050
DB_NAME="virtual_classroom_dev"
DB_HOST="your_mongodb_connection_string" // String is Already prest in .env file 

# Start server
npm run dev
```

## API Endpoints
- `GET /api/classroom` - Get all classrooms
- `POST /api/classroom` - Create classroom
- `GET /api/classroom/:roomId/status` - Get classroom status
- `GET /api/classroom/:roomId/reports` - Get classroom reports

## Socket Events
### Client → Server
- `join-room` - Join classroom
- `leave-room` - Leave classroom
- `start-class` - Start class (teacher only)
- `end-class` - End class (teacher only)

### Server → Client
- `join-success` - Join successful
- `join-denied` - Join denied
- `room-update` - Room state updated
- `class-started` - Class started
- `class-ended` - Class ended
- `error` - Error notification

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io for real-time communication
- RESTful API architecture

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Account (or local MongoDB installation)
- npm or yarn package manager

### Installation and Setup

1. Clone the repository (if not already done)

2. Navigate to the backend directory:
```
cd backend
```

3. Install dependencies:
```
npm install
```

4. Create a `.env` file in the root of the backend directory with the following variables:
```
PORT=5000
DB_NAME="virtual_classroom_dev"
DB_HOST="your_mongodb_connection_string"
```

*Note: Replace "your_mongodb_connection_string" with your actual MongoDB connection string.*

5. Start the development server:
```
npm run dev
```

The server will start on the port specified in your `.env` file (default: 5000) and will connect to the MongoDB database.

## Data Models

### Classroom

The main data model for the application with the following structure:

- **roomId**: String (unique identifier for the classroom)
- **isActive**: Boolean (whether the class is active)
- **status**: String (NOT_STARTED, ONGOING, ENDED)
- **events**: Array (list of events that occurred in the classroom)
- **createdAt**: Date (when the classroom was created)
- **updatedAt**: Date (when the classroom was last updated)

## Running Tests

To test the classroom functionality:
```
npm run test:classroom
```

## Error Handling

The API provides standardized error responses with appropriate HTTP status codes:

- **400** - Bad Request (invalid input)
- **403** - Forbidden (unauthorized access)
- **404** - Not Found (resource not found)
- **409** - Conflict (resource already exists)
- **500** - Server Error (internal server error)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 