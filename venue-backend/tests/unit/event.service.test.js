const eventService = require('../../src/modules/events/event.service');
const Event = require('../../src/modules/events/event.model');
const Slot = require('../../src/modules/slots/slot.model');
const generateSlots = require('../../src/utils/generateSlots');
const AppError = require('../../src/utils/AppError');

jest.mock('../../src/modules/events/event.model');
jest.mock('../../src/modules/slots/slot.model');
jest.mock('../../src/utils/generateSlots');

describe('Event Service Unit Tests', () => {
  let mockSession;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock session
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    Event.startSession = jest.fn().mockResolvedValue(mockSession);
  });

  describe('createEvent', () => {
    const mockEventData = {
      title: 'Test Event',
      description: 'A test event description',
      startDate: '2026-05-01',
      endDate: '2026-05-02',
      slotDuration: 60,
      capacityPerSlot: 100,
    };

    const mockUserId = '507f1f77bcf86cd799439011';

    it('should create event with slots successfully', async () => {
      const mockEvent = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Event',
        description: 'A test event description',
        organizerId: mockUserId,
      };

      const mockSlots = [
        { date: '2026-05-01', startTime: '09:00', capacity: 100 },
        { date: '2026-05-01', startTime: '10:00', capacity: 100 },
      ];

      const mockCreatedSlots = [
        { ...mockSlots[0], eventId: mockEvent._id },
        { ...mockSlots[1], eventId: mockEvent._id },
      ];

      Event.create = jest.fn().mockResolvedValue([mockEvent]);
      generateSlots.mockReturnValue(mockSlots);
      Slot.insertMany = jest.fn().mockResolvedValue(mockCreatedSlots);

      const result = await eventService.createEvent(mockEventData, mockUserId);

      expect(Event.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(Event.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Test Event',
            organizerId: mockUserId,
          }),
        ]),
        { session: mockSession }
      );
      expect(generateSlots).toHaveBeenCalledWith(
        '2026-05-01',
        '2026-05-02',
        60,
        100
      );
      expect(Slot.insertMany).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(result).toEqual({
        event: mockEvent,
        slots: mockCreatedSlots,
      });
    });

    it('should rollback transaction on error', async () => {
      const error = new Error('Database error');
      Event.create = jest.fn().mockRejectedValue(error);

      await expect(eventService.createEvent(mockEventData, mockUserId)).rejects.toThrow('Database error');

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    });

    it('should handle slot generation failure', async () => {
      const mockEvent = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Event',
      };

      Event.create = jest.fn().mockResolvedValue([mockEvent]);
      generateSlots.mockImplementation(() => {
        throw new Error('Invalid date range');
      });

      await expect(eventService.createEvent(mockEventData, mockUserId)).rejects.toThrow('Invalid date range');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should attach eventId to all generated slots', async () => {
      const mockEvent = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Event',
      };

      const mockSlots = [
        { date: '2026-05-01', startTime: '09:00' },
        { date: '2026-05-01', startTime: '10:00' },
        { date: '2026-05-01', startTime: '11:00' },
      ];

      Event.create = jest.fn().mockResolvedValue([mockEvent]);
      generateSlots.mockReturnValue(mockSlots);
      Slot.insertMany = jest.fn().mockResolvedValue([]);

      await eventService.createEvent(mockEventData, mockUserId);

      expect(Slot.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ eventId: mockEvent._id }),
          expect.objectContaining({ eventId: mockEvent._id }),
          expect.objectContaining({ eventId: mockEvent._id }),
        ]),
        { session: mockSession }
      );
    });
  });

  describe('getEvents', () => {
    it('should return events with count', async () => {
      const mockEvents = [
        { _id: '1', title: 'Event 1' },
        { _id: '2', title: 'Event 2' },
      ];

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getFilter: jest.fn().mockReturnValue({}),
      };

      Event.find = jest.fn().mockReturnValue(mockQuery);
      Event.countDocuments = jest.fn().mockResolvedValue(2);

      // Mock the query execution
      const mockAPIFeatures = require('../../src/utils/APIFeatures');
      mockAPIFeatures.prototype.query = Promise.resolve(mockEvents);

      const result = await eventService.getEvents({});

      expect(Event.find).toHaveBeenCalled();
      expect(Event.countDocuments).toHaveBeenCalled();
    });

    it('should handle empty event list', async () => {
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getFilter: jest.fn().mockReturnValue({}),
      };

      Event.find = jest.fn().mockReturnValue(mockQuery);
      Event.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await eventService.getEvents({});

      expect(Event.countDocuments).toHaveBeenCalled();
    });
  });

  describe('getEventById', () => {
    it('should return event when found', async () => {
      const mockEvent = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Event',
        description: 'Description',
      };

      Event.findById = jest.fn().mockResolvedValue(mockEvent);

      const result = await eventService.getEventById('507f1f77bcf86cd799439011');

      expect(Event.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockEvent);
    });

    it('should throw AppError when event not found', async () => {
      Event.findById = jest.fn().mockResolvedValue(null);

      await expect(eventService.getEventById('nonexistent-id')).rejects.toThrow(AppError);
      await expect(eventService.getEventById('nonexistent-id')).rejects.toThrow('Event not found');
    });

    it('should throw error with 404 status code', async () => {
      Event.findById = jest.fn().mockResolvedValue(null);

      try {
        await eventService.getEventById('nonexistent-id');
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe('getEventSlots', () => {
    const mockEventId = '507f1f77bcf86cd799439011';

    it('should return all slots for event when activeOnly is false', async () => {
      const mockSlots = [
        { _id: '1', availableSeats: 10, date: '2026-05-01' },
        { _id: '2', availableSeats: 0, date: '2026-05-02' },
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockSlots),
      };

      Slot.find = jest.fn().mockReturnValue(mockQuery);

      const result = await eventService.getEventSlots(mockEventId, false);

      expect(Slot.find).toHaveBeenCalledWith({
        parentId: mockEventId,
        parentType: 'Event',
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ date: 1, startTime: 1 });
      expect(result).toEqual(mockSlots);
    });

    it('should return only active slots when activeOnly is true', async () => {
      const mockSlots = [
        { _id: '1', availableSeats: 10, date: '2026-05-01' },
        { _id: '2', availableSeats: 5, date: '2026-05-02' },
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockSlots),
      };

      Slot.find = jest.fn().mockReturnValue(mockQuery);

      const result = await eventService.getEventSlots(mockEventId, true);

      expect(Slot.find).toHaveBeenCalledWith({
        parentId: mockEventId,
        parentType: 'Event',
        availableSeats: { $gt: 0 },
      });
      expect(result).toEqual(mockSlots);
    });

    it('should return empty array when no slots found', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue([]),
      };

      Slot.find = jest.fn().mockReturnValue(mockQuery);

      const result = await eventService.getEventSlots(mockEventId, false);

      expect(result).toEqual([]);
    });

    it('should sort slots by date and startTime', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue([]),
      };

      Slot.find = jest.fn().mockReturnValue(mockQuery);

      await eventService.getEventSlots(mockEventId, false);

      expect(mockQuery.sort).toHaveBeenCalledWith({ date: 1, startTime: 1 });
    });
  });

  describe('getEventsByOrganizer', () => {
    const mockOrganizerId = '507f1f77bcf86cd799439011';

    it('should return events for organizer', async () => {
      const mockEvents = [
        { _id: '1', title: 'Event 1', organizerId: mockOrganizerId },
        { _id: '2', title: 'Event 2', organizerId: mockOrganizerId },
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockEvents),
      };

      Event.find = jest.fn().mockReturnValue(mockQuery);

      const result = await eventService.getEventsByOrganizer(mockOrganizerId);

      expect(Event.find).toHaveBeenCalledWith({ organizerId: mockOrganizerId });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockEvents);
    });

    it('should return empty array when organizer has no events', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue([]),
      };

      Event.find = jest.fn().mockReturnValue(mockQuery);

      const result = await eventService.getEventsByOrganizer(mockOrganizerId);

      expect(result).toEqual([]);
    });

    it('should sort events by createdAt descending', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue([]),
      };

      Event.find = jest.fn().mockReturnValue(mockQuery);

      await eventService.getEventsByOrganizer(mockOrganizerId);

      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });
});
