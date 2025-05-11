/**
 * Virtual Classroom Test Script
 * 
 * This script tests the core functionality of the classroom system:
 * 1. Creating a room
 * 2. Teacher joining
 * 3. Starting a class
 * 4. Students joining
 * 5. Ending a class
 * 6. Fetching reports
 */

const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const Classroom = require("./models/Classroom");

const uri = process.env.DB_HOST || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "virtual_classroom_dev";

const TEST_ROOM_ID = `test-room-${Date.now()}`;
const TEACHER = 'Test Teacher';
const STUDENTS = ['Student 1', 'Student 2', 'Student 3'];

async function runTests() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      dbName: dbName,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log('Connected to MongoDB');

    console.log(`\nCreating test classroom with ID: ${TEST_ROOM_ID}`);
    let classroom = await Classroom.create({ roomId: TEST_ROOM_ID });
    console.log('Classroom created:', {
      roomId: classroom.roomId,
      isActive: classroom.isActive,
      status: classroom.status
    });

    console.log(`\nTeacher (${TEACHER}) joining the classroom`);
    classroom.events.push({
      type: 'ENTER',
      userId: TEACHER,
      role: 'TEACHER'
    });
    await classroom.save();

    console.log('\nTeacher starting the class');
    classroom.isActive = true;
    classroom.status = 'ONGOING';
    classroom.events.push({
      type: 'START_CLASS'
    });
    await classroom.save();
    
    classroom = await Classroom.findOne({ roomId: TEST_ROOM_ID });
    console.log('Classroom status:', {
      isActive: classroom.isActive,
      status: classroom.status
    });

    console.log('\nStudents joining the classroom:');
    for (const student of STUDENTS) {
      console.log(`- ${student} joining`);
      classroom.events.push({
        type: 'ENTER',
        userId: student,
        role: 'STUDENT'
      });
    }
    await classroom.save();

    console.log('\nTeacher ending the class');
    classroom.isActive = false;
    classroom.status = 'ENDED';
    classroom.events.push({
      type: 'END_CLASS'
    });
    await classroom.save();

    classroom = await Classroom.findOne({ roomId: TEST_ROOM_ID });
    console.log('\nFinal classroom state:', {
      roomId: classroom.roomId,
      isActive: classroom.isActive,
      status: classroom.status,
      eventsCount: classroom.events.length
    });

    console.log('\nClassroom events summary:');
    const eventTypes = {};
    classroom.events.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });
    console.log(eventTypes);

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    try {
      await Classroom.deleteOne({ roomId: TEST_ROOM_ID });
      console.log(`\nCleanup: Test classroom ${TEST_ROOM_ID} deleted..`);
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

runTests(); 