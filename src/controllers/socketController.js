const Classroom = require("../models/Classroom");

const activeClassrooms = {};

const initSocketController = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join-room", async ({ roomId, userId, role }) => {
      try {
        if (!roomId || !userId || !role) {
          socket.emit("error", {
            status: 400,
            message: "Room ID, user ID, and role are required",
          });
          return;
        }

        let classroom = await Classroom.findOne({ roomId });

        if (!classroom) {
          if (role === "STUDENT") {
            socket.emit("error", {
              status: 404,
              message:
                "This classroom does not exist. Only teachers can create new classrooms.",
            });
            return;
          }

          if (role === "TEACHER") {
            try {
              classroom = await Classroom.create({ roomId });
              console.log(`New classroom created by teacher: ${roomId}`);
            } catch (err) {
              socket.emit("error", {
                status: 500,
                message: "Failed to create classroom",
              });
              return;
            }
          }
        }

        if (classroom.status === "ENDED") {
          socket.emit("join-denied", {
            status: 403,
            message: "This class has already ended and cannot be joined.",
          });
          return;
        }

        if (
          role === "STUDENT" &&
          (!classroom.isActive || classroom.status !== "ONGOING")
        ) {
          socket.emit("join-denied", {
            status: 403,
            message:
              "Class has not started yet. Please wait for a teacher to start the class.",
          });
          return;
        }

        if (!activeClassrooms[roomId]) {
          activeClassrooms[roomId] = {
            teachers: [],
            students: [],
            isActive: classroom.isActive,
            status: classroom.status,
          };
        }

        if (role === "TEACHER") {
          if (!activeClassrooms[roomId].teachers.includes(userId)) {
            activeClassrooms[roomId].teachers.push(userId);
          }
        } else {
          if (!activeClassrooms[roomId].students.includes(userId)) {
            activeClassrooms[roomId].students.push(userId);
          }
        }

        socket.join(roomId);

        classroom.events.push({
          type: "ENTER",
          userId,
          role,
          timestamp: new Date(),
        });
        await classroom.save();

        socket.emit("join-success", {
          status: 200,
          message: `Successfully joined classroom as ${role}`,
          data: {
            roomId,
            role,
            isActive: classroom.isActive,
            status: classroom.status,
            teachers: activeClassrooms[roomId].teachers,
            students: activeClassrooms[roomId].students,
          },
        });

        io.to(roomId).emit("room-update", {
          status: 200,
          message: "Room updated",
          data: {
            teachers: activeClassrooms[roomId].teachers,
            students: activeClassrooms[roomId].students,
            isActive: activeClassrooms[roomId].isActive,
            status: activeClassrooms[roomId].status,
          },
        });

        socket.userData = { roomId, userId, role };

        if (
          role === "TEACHER" &&
          classroom &&
          classroom.status === "NOT_STARTED"
        ) {
          socket.emit("classroom-created", {
            status: 201,
            message: "Classroom initialized successfully",
            data: {
              roomId: classroom.roomId,
              isActive: classroom.isActive,
              status: classroom.status,
            },
          });
        }

        console.log(`${role} ${userId} joined room ${roomId}`);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", {
          status: 500,
          message: "Failed to join room. Please try again.",
        });
      }
    });

    socket.on("start-class", async ({ roomId }) => {
      try {
        if (!socket.userData || socket.userData.role !== "TEACHER") {
          socket.emit("error", {
            status: 403,
            message: "Only teachers can start a class",
          });
          return;
        }

        if (!activeClassrooms[roomId]) {
          socket.emit("error", {
            status: 404,
            message: "Classroom not found",
          });
          return;
        }

        // Update in-memory state
        activeClassrooms[roomId].isActive = true;
        activeClassrooms[roomId].status = "ONGOING";

        const classroom = await Classroom.findOne({ roomId });
        if (!classroom) {
          socket.emit("error", {
            status: 404,
            message: "Classroom not found in database",
          });
          return;
        }

        classroom.isActive = true;
        classroom.status = "ONGOING";
        classroom.events.push({
          type: "START_CLASS",
          timestamp: new Date(),
        });
        await classroom.save();

        // Notify all clients in the room
        io.to(roomId).emit("class-started", {
          status: 200,
          message: "Class has started",
          data: {
            startedBy: socket.userData.userId,
            timestamp: new Date(),
          },
        });

        io.to(roomId).emit("room-update", {
          status: 200,
          message: "Room updated",
          data: {
            teachers: activeClassrooms[roomId].teachers,
            students: activeClassrooms[roomId].students,
            isActive: activeClassrooms[roomId].isActive,
            status: activeClassrooms[roomId].status,
          },
        });

        console.log(
          `Class started in room ${roomId} by ${socket.userData.userId}`
        );
      } catch (error) {
        console.error("Error starting class:", error);
        socket.emit("error", {
          status: 500,
          message: "Failed to start class. Please try again.",
        });
      }
    });

    socket.on("end-class", async ({ roomId }) => {
      try {
        if (!socket.userData || socket.userData.role !== "TEACHER") {
          socket.emit("error", {
            status: 403,
            message: "Only teachers can end a class",
          });
          return;
        }

        if (!activeClassrooms[roomId]) {
          socket.emit("error", {
            status: 404,
            message: "Classroom not found",
          });
          return;
        }

        activeClassrooms[roomId].isActive = false;
        activeClassrooms[roomId].status = "ENDED";

        const classroom = await Classroom.findOne({ roomId });
        if (!classroom) {
          socket.emit("error", {
            status: 404,
            message: "Classroom not found in database",
          });
          return;
        }

        classroom.isActive = false;
        classroom.status = "ENDED";
        classroom.events.push({
          type: "END_CLASS",
          timestamp: new Date(),
        });
        await classroom.save();

        io.to(roomId).emit("class-ended", {
          status: 200,
          message: "Class has ended",
          data: {
            endedBy: socket.userData.userId,
            timestamp: new Date(),
          },
        });

        io.to(roomId).emit("room-update", {
          status: 200,
          message: "Room updated",
          data: {
            teachers: activeClassrooms[roomId].teachers,
            students: activeClassrooms[roomId].students,
            isActive: activeClassrooms[roomId].isActive,
            status: activeClassrooms[roomId].status,
          },
        });

        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (roomSockets) {
          for (const socketId of roomSockets) {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket && clientSocket.userData) {
              const { userId, role } = clientSocket.userData;
              if (role === "TEACHER" && activeClassrooms[roomId]) {
                activeClassrooms[roomId].teachers = activeClassrooms[
                  roomId
                ].teachers.filter((id) => id !== userId);
              } else if (activeClassrooms[roomId]) {
                activeClassrooms[roomId].students = activeClassrooms[
                  roomId
                ].students.filter((id) => id !== userId);
              }

              clientSocket.leave(roomId);
            }
          }
        }

        console.log(`Class ended - ${roomId} by ${socket.userData.userId}`);
      } catch (error) {
        console.error("Error ending class:", error);
        socket.emit("error", {
          status: 500,
          message: "Failed to end class. Please try again.",
        });
      }
    });

    socket.on("leave-room", async () => {
      try {
        const { roomId, userId, role } = socket.userData || {};
        if (!roomId || !userId || !role) {
          socket.emit("error", {
            status: 400,
            message: "Not currently in a room",
          });
          return;
        }

        if (activeClassrooms[roomId]) {
          if (role === "TEACHER") {
            activeClassrooms[roomId].teachers = activeClassrooms[
              roomId
            ].teachers.filter((id) => id !== userId);
          } else {
            activeClassrooms[roomId].students = activeClassrooms[
              roomId
            ].students.filter((id) => id !== userId);
          }

          const classroom = await Classroom.findOne({ roomId });
          if (classroom) {
            classroom.events.push({
              type: "EXIT",
              userId,
              role,
              timestamp: new Date(),
            });
            await classroom.save();
          }
        }

        socket.leave(roomId);

        const oldData = { ...socket.userData };
        socket.userData = null;

        socket.emit("leave-success", {
          status: 200,
          message: "Successfully left the classroom",
        });

        if (activeClassrooms[oldData.roomId]) {
          io.to(oldData.roomId).emit("room-update", {
            status: 200,
            message: "Room updated",
            data: {
              teachers: activeClassrooms[oldData.roomId].teachers,
              students: activeClassrooms[oldData.roomId].students,
              isActive: activeClassrooms[oldData.roomId].isActive,
              status: activeClassrooms[oldData.roomId].status,
            },
          });
        }

        console.log(`${role} ${userId} left room ${roomId}`);
      } catch (error) {
        console.error("Error leaving room:", error);
        socket.emit("error", {
          status: 500,
          message: "Failed to leave room properly",
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        const { roomId, userId, role } = socket.userData || {};
        if (!roomId || !userId || !role) return;

        if (activeClassrooms[roomId]) {
          if (role === "TEACHER") {
            activeClassrooms[roomId].teachers = activeClassrooms[
              roomId
            ].teachers.filter((id) => id !== userId);
          } else {
            activeClassrooms[roomId].students = activeClassrooms[
              roomId
            ].students.filter((id) => id !== userId);
          }

          const classroom = await Classroom.findOne({ roomId });
          if (classroom) {
            classroom.events.push({
              type: "EXIT",
              userId,
              role,
              timestamp: new Date(),
            });
            await classroom.save();

            io.to(roomId).emit("room-update", {
              status: 200,
              message: "Room updated",
              data: {
                teachers: activeClassrooms[roomId].teachers,
                students: activeClassrooms[roomId].students,
                isActive: activeClassrooms[roomId].isActive,
                status: activeClassrooms[roomId].status,
              },
            });
          }
        }

        console.log(`${role} ${userId} disconnected from room ${roomId}`);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });
};

module.exports = initSocketController;
