const generateAutoSlots = require('../../src/utils/autoSlotGenerator');

describe('AutoSlotGenerator Utility', () => {
  describe('generateAutoSlots for Movies', () => {
    it('should generate movie slots for a date range', () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-03');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      // 3 days * 3 slots per day = 9 slots
      expect(slots.length).toBe(9);
    });

    it('should generate correct movie time slots', () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-01');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      expect(slots.length).toBe(3); // 3 slots per day
      expect(slots[0].startTime).toBe('10:00');
      expect(slots[0].endTime).toBe('13:00');
      expect(slots[1].startTime).toBe('14:00');
      expect(slots[1].endTime).toBe('17:00');
      expect(slots[2].startTime).toBe('18:00');
      expect(slots[2].endTime).toBe('21:00');
    });

    it('should use default movie capacity of 60', () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-01');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      slots.forEach(slot => {
        expect(slot.capacity).toBe(60);
        expect(slot.availableSeats).toBe(60);
      });
    });

    it('should use custom capacity when provided', () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-01');
      const options = { capacity: 150 };
      
      const slots = generateAutoSlots('Movie', startDate, endDate, options);
      
      slots.forEach(slot => {
        expect(slot.capacity).toBe(150);
        expect(slot.availableSeats).toBe(150);
      });
    });

    it('should set all slots to AVAILABLE status', () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-02');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      slots.forEach(slot => {
        expect(slot.status).toBe('AVAILABLE');
      });
    });

    it('should handle multiple days correctly', () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-07'); // 7 days
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      expect(slots.length).toBe(21); // 7 days * 3 slots
    });

    it('should set date to midnight for each slot', () => {
      const startDate = new Date('2026-03-01T15:30:00');
      const endDate = new Date('2026-03-01T20:00:00');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      slots.forEach(slot => {
        expect(slot.date.getHours()).toBe(0);
        expect(slot.date.getMinutes()).toBe(0);
        expect(slot.date.getSeconds()).toBe(0);
      });
    });
  });

  describe('generateAutoSlots for Events', () => {
    it('should generate event slots for a date range', () => {
      const startDate = new Date('2026-04-01');
      const endDate = new Date('2026-04-05');
      
      const slots = generateAutoSlots('Event', startDate, endDate);
      
      // 5 days * 3 slots per day = 15 slots
      expect(slots.length).toBe(15);
    });

    it('should generate correct event time slots', () => {
      const startDate = new Date('2026-04-01');
      const endDate = new Date('2026-04-01');
      
      const slots = generateAutoSlots('Event', startDate, endDate);
      
      expect(slots.length).toBe(3);
      expect(slots[0].startTime).toBe('09:00');
      expect(slots[0].endTime).toBe('12:00');
      expect(slots[1].startTime).toBe('14:00');
      expect(slots[1].endTime).toBe('17:00');
      expect(slots[2].startTime).toBe('19:00');
      expect(slots[2].endTime).toBe('22:00');
    });

    it('should use default event capacity of 100', () => {
      const startDate = new Date('2026-04-01');
      const endDate = new Date('2026-04-01');
      
      const slots = generateAutoSlots('Event', startDate, endDate);
      
      slots.forEach(slot => {
        expect(slot.capacity).toBe(100);
        expect(slot.availableSeats).toBe(100);
      });
    });

    it('should accept custom capacity for events', () => {
      const startDate = new Date('2026-04-01');
      const endDate = new Date('2026-04-01');
      const options = { capacity: 500 };
      
      const slots = generateAutoSlots('Event', startDate, endDate, options);
      
      slots.forEach(slot => {
        expect(slot.capacity).toBe(500);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single day range', () => {
      const startDate = new Date('2026-05-15');
      const endDate = new Date('2026-05-15');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      expect(slots.length).toBe(3);
    });

    it('should handle same start and end date', () => {
      const date = new Date('2026-06-10');
      
      const slots = generateAutoSlots('Event', date, date);
      
      expect(slots.length).toBe(3);
      expect(slots[0].date.toDateString()).toBe(date.toDateString());
    });

    it('should handle date strings', () => {
      const startDate = new Date('2026-07-01');
      const endDate = new Date('2026-07-02');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      expect(slots.length).toBe(6);
    });

    it('should return empty options as default', () => {
      const startDate = new Date('2026-08-01');
      const endDate = new Date('2026-08-01');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('capacity');
    });

    it('should handle long date ranges', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31'); // Full month
      
      const slots = generateAutoSlots('Event', startDate, endDate);
      
      expect(slots.length).toBe(93); // 31 days * 3 slots
    });

    it('should preserve date ordering across multiple days', () => {
      const startDate = new Date('2026-09-01');
      const endDate = new Date('2026-09-05');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      // Check dates are in ascending order
      for (let i = 0; i < slots.length - 1; i++) {
        const currentDate = new Date(slots[i].date).getTime();
        const nextDate = new Date(slots[i + 1].date).getTime();
        expect(currentDate).toBeLessThanOrEqual(nextDate);
      }
    });
  });

  describe('Slot Properties', () => {
    it('should have all required slot properties', () => {
      const startDate = new Date('2026-10-01');
      const endDate = new Date('2026-10-01');
      
      const slots = generateAutoSlots('Movie', startDate, endDate);
      
      slots.forEach(slot => {
        expect(slot).toHaveProperty('date');
        expect(slot).toHaveProperty('startTime');
        expect(slot).toHaveProperty('endTime');
        expect(slot).toHaveProperty('capacity');
        expect(slot).toHaveProperty('availableSeats');
        expect(slot).toHaveProperty('status');
      });
    });

    it('should have capacity equal to availableSeats initially', () => {
      const startDate = new Date('2026-11-01');
      const endDate = new Date('2026-11-01');
      
      const slots = generateAutoSlots('Event', startDate, endDate, { capacity: 200 });
      
      slots.forEach(slot => {
        expect(slot.capacity).toBe(slot.availableSeats);
      });
    });
  });
});
