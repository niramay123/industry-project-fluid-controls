import { Task } from "../models/task.models.js";
import { createNotification } from './notification.controllers.js';


export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      deadline,
      attachments = [],
      priority,
    } = req.body;

    if (!title || !description || !deadline || !priority) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (title, description, deadline, priority) are required",
      });
    }

    if (new Date(deadline) <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Deadline must be a future date",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim(),
      deadline: new Date(deadline),
      attachments: Array.isArray(attachments) ? attachments : [attachments],
      priority: priority || "Medium",
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    // console.error("Error creating task:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// In controllers/task.controllers.js

export const assignTask = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const { id } = req.params;

    if (!assignedTo) {
      return res.status(400).json({ success: false, message: "assignedTo is required" });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { assignedTo },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // ✔ Notification Logic (Handles Array or Single ID)
    const message = `Task "${task.title}" has been assigned to you.`;
    
    if (Array.isArray(assignedTo)) {
        // If multiple people assigned, notify all
        assignedTo.forEach(userId => {
            createNotification(userId, message, task._id);
        });
    } else {
        // Single person
        createNotification(assignedTo, message, task._id);
    }

    res.status(200).json({ success: true, message: "Task assigned successfully", task });
  } catch (error) {
    console.error("Error assigning task:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const editTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, priority, attachments } = req.body;

    const task = await Task.findByIdAndUpdate(
      id,
      { title, description, deadline, priority, attachments },
      { new: true }
    );

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error editing task:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getTask = async (req, res) => {
  try {
    let filter = {};

    // Role-based filtering with array role support
    if (
      Array.isArray(req.user.role)
        ? req.user.role.includes("supervisor")
        : req.user.role === "supervisor"
    ) {
      filter.createdBy = req.user.id;
    } else if (
      Array.isArray(req.user.role)
        ? req.user.role.includes("operator")
        : req.user.role === "operator"
    ) {
      filter.assignedTo = req.user.id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")

      .sort({ createdAt: -1 });

    if (!tasks.length) {
      return res
        .status(200)
        .json({ success: true, message: "No tasks found", tasks: [] });
    }

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching tasks",
        error: error.message,
      });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update task status


export const updateStatus = async (req, res) => {
  try {
    const { status, comment } = req.body; 
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Ensure operator is assigned
    const assignedCheck = Array.isArray(task.assignedTo)
      ? task.assignedTo.map(id => id.toString()).includes(req.user.id)
      : task.assignedTo.toString() === req.user.id;

    if (!assignedCheck) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Update task fields
    task.status = status;
    if (comment) {
      task.comments.push({ text: comment, user: req.user.id });
    }

    await task.save();

    // 🔥 Populate before sending response
    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(200).json({ 
      success: true, 
      message: "Task status updated", 
      task: populatedTask 
    });

  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating task status", 
      error: error.message 
    });
  }
};





