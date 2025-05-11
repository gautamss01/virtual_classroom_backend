const express = require('express');
const classroomController = require('../controllers/classroomController');

const router = express.Router();

// GET all classrooms
router.get('/', classroomController.getAllClassrooms);

// GET classroom status
router.get('/:roomId/status', classroomController.getClassroomStatus);

// GET classroom reports
router.get('/:roomId/reports', classroomController.getClassroomReports);

// POST create a new classroom
router.post('/', classroomController.createClassroom);

module.exports = router; 