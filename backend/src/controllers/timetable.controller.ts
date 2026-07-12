import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const getStudentTimetable = async (req: AuthRequest, res: Response) => {
  const classGroup = req.user?.classGroup;

  if (!classGroup) {
    return res.status(400).json({ error: 'No class group section assigned to this student user' });
  }

  try {
    const slots = await prisma.timetableSlot.findMany({
      where: { classGroup },
      include: {
        subject: true,
      },
    });

    // Format schedule for Monday through Friday with 8 periods per day
    const schedule = DAYS.map((day) => {
      const slotsArray = new Array(8).fill(null);
      const daySlots = slots.filter((s) => s.day.toLowerCase() === day.toLowerCase());

      daySlots.forEach((slot) => {
        if (slot.slotIndex >= 0 && slot.slotIndex < 8) {
          if (slot.subjectCode) {
            slotsArray[slot.slotIndex] = {
              subject: slot.subject ? slot.subject.name : slot.subjectCode,
              room: slot.room || 'LH-N/A',
            };
          }
        }
      });

      return {
        day,
        slots: slotsArray,
      };
    });

    return res.status(200).json(schedule);
  } catch (error) {
    console.error('Error fetching student timetable:', error);
    return res.status(500).json({ error: 'Internal server error while fetching student schedule' });
  }
};

export const getTeacherTimetable = async (req: AuthRequest, res: Response) => {
  const teacherId = req.user?.id;

  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher ID not found in session context' });
  }

  try {
    const slots = await prisma.timetableSlot.findMany({
      where: { teacherId },
      include: {
        subject: true,
      },
    });

    // Format schedule for Monday through Friday with 8 periods per day
    const schedule = DAYS.map((day) => {
      const slotsArray = new Array(8).fill(null);
      const daySlots = slots.filter((s) => s.day.toLowerCase() === day.toLowerCase());

      daySlots.forEach((slot) => {
        if (slot.slotIndex >= 0 && slot.slotIndex < 8) {
          if (slot.subjectCode) {
            slotsArray[slot.slotIndex] = {
              subject: slot.subject ? slot.subject.name : slot.subjectCode,
              room: slot.room || 'LH-N/A',
              class: slot.classGroup, // e.g. "CSE-B" for teacher timetable
            };
          }
        }
      });

      return {
        day,
        slots: slotsArray,
      };
    });

    return res.status(200).json(schedule);
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    return res.status(500).json({ error: 'Internal server error while fetching teacher timetable' });
  }
};
export const getTeacherSubjects = async (req: AuthRequest, res: Response) => {
  const teacherId = req.user?.id;
  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher ID not found' });
  }
  try {
    const subjects = await prisma.subject.findMany({
      where: { facultyId: teacherId },
      select: { code: true, name: true, classGroup: true }
    });
    return res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
