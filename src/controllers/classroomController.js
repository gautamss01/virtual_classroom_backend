const Classroom = require("../models/Classroom");

const getClassroomReports = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!roomId) {
      return res.status(400).json({
        status: 400,
        message: "Room ID is required"
      });
    }
    
    const classroom = await Classroom.findOne({ roomId });

    if (!classroom) {
      return res.status(404).json({ 
        status: 404, 
        message: "Classroom not found" 
      });
    }

    const eventsWithTimestamps = classroom.events.map(event => {
      if (!event.timestamp) {
        return {
          ...event.toObject(),
          timestamp: event.createdAt || new Date()
        };
      }
      return event;
    });

    return res.status(200).json({
      status: 200,
      message: "Reports retrieved successfully",
      data: {
        events: eventsWithTimestamps,
        classroom: {
          roomId: classroom.roomId,
          isActive: classroom.isActive,
          status: classroom.status,
          createdAt: classroom.createdAt,
          updatedAt: classroom.updatedAt
        },
      },
    });
  } catch (error) {
    console.error("Error getting classroom reports:", error);
    return res.status(500).json({ 
      status: 500, 
      message: "Server error while retrieving reports" 
    });
  }
};

const createClassroom = async (req, res) => {
  try {
    const { roomId, role } = req.body;

    if (!roomId) {
      return res.status(400).json({
        status: 400,
        message: "Room ID is required",
      });
    }
    
    if (role !== "TEACHER") {
      return res.status(403).json({
        status: 403,
        message: "Only teachers can create classrooms",
      });
    }

    let classroom = await Classroom.findOne({ roomId });

    if (classroom) {
      return res.status(200).json({ 
        status: 200, 
        message: "Classroom already exists and ready to join",
        data: {
          roomId: classroom.roomId,
          isActive: classroom.isActive,
          status: classroom.status,
        }
      });
    }

    classroom = await Classroom.create({ roomId });

    return res.status(201).json({
      status: 201,
      message: "Classroom created successfully",
      data: {
        roomId: classroom.roomId,
        isActive: classroom.isActive,
        status: classroom.status,
        createdAt: classroom.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating classroom:", error);
    return res.status(500).json({ 
      status: 500, 
      message: "Server error while creating classroom" 
    });
  }
};

const getClassroomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { role } = req.query;
    
    const classroom = await Classroom.findOne({ roomId });

    if (!classroom) {
      return res.status(404).json({ 
        status: 404, 
        message: role === "STUDENT" ? "This classroom does not exist" : "Classroom not found" 
      });
    }
    
    if (role === "STUDENT" && (!classroom.isActive || classroom.status !== "ONGOING")) {
      return res.status(403).json({
        status: 403,
        message: "Class has not started yet. Please wait for a teacher to start the class.",
        data: {
          roomId: classroom.roomId,
          isActive: classroom.isActive,
          status: classroom.status,
        }
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Classroom status retrieved successfully",
      data: {
        roomId: classroom.roomId,
        isActive: classroom.isActive,
        status: classroom.status,
      },
    });
  } catch (error) {
    console.error("Error getting classroom status:", error);
    return res.status(500).json({ 
      status: 500, 
      message: "Server error while retrieving classroom status" 
    });
  }
};

const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find().select(
      "roomId isActive status createdAt"
    );

    return res.status(200).json({ 
      status: 200,
      message: "Classrooms retrieved successfully",
      data: { classrooms } 
    });
  } catch (error) {
    console.error("Error getting all classrooms:", error);
    return res.status(500).json({ 
      status: 500, 
      message: "Server error while retrieving classrooms" 
    });
  }
};

module.exports = {
  getClassroomReports,
  createClassroom,
  getClassroomStatus,
  getAllClassrooms,
};
