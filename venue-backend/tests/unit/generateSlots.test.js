const generateSlots = require('../../src/utils/generateSlots');

describe('generateSlots Utility', () => {
  describe('Basic slot generation', () => {
    it('should generate slots for a single day', () => {
      const startDate = '2026-05-01T00:00:00';
      const endDate = '2026-05-01T23:59:59';
      const slotDuration = 60; // 1 hour
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('date');
      expect(slots[0]).toHaveProperty('startTime');
      expect(slots[0]).toHaveProperty('endTime');
      expect(slots[0]).toHaveProperty('remainingCapacity');
      expect(slots[0]).toHaveProperty('status');
    });

    it('should generate correct number of slots for 1-hour duration', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T17:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 50;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      // From 09:00 to 17:00 = 8 hours = 8 slots
      expect(slots.length).toBe(8);
    });

    it('should generate correct number of slots for 30-minute duration', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T11:00:00';
      const slotDuration = 30;
      const capacityPerSlot = 50;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      // From 09:00 to 11:00 = 2 hours = 4 slots of 30 min each
      expect(slots.length).toBe(4);
    });

    it('should set correct capacity for each slot', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T10:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 200;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      slots.forEach(slot => {
        expect(slot.remainingCapacity).toBe(200);
      });
    });

    it('should set all slots to AVAILABLE status', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T10:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      slots.forEach(slot => {
        expect(slot.status).toBe('AVAILABLE');
      });
    });
  });

  describe('Multi-day slot generation', () => {
    it('should generate slots across multiple days', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-03T17:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots.length).toBeGreaterThan(8); // More than a single day

      // Check multiple dates exist
      const uniqueDates = [...new Set(slots.map(s => s.date.toDateString()))];
      expect(uniqueDates.length).toBeGreaterThan(1);
    });

    it('should generate slots for each day in range', () => {
      const startDate = '2026-05-01T00:00:00';
      const endDate = '2026-05-02T23:59:59';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      // Get unique dates
      const uniqueDates = [...new Set(slots.map(s => {
        const d = new Date(s.date);
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      }))];

      expect(uniqueDates.length).toBe(2); // 2 days
    });
  });

  describe('Time formatting', () => {
    it('should format start and end times correctly (HH:MM)', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T10:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      slots.forEach(slot => {
        expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/);
        expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/);
      });
    });

    it('should correctly calculate slot end time', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T11:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots[0].startTime).toBe('09:00');
      expect(slots[0].endTime).toBe('10:00');
      expect(slots[1].startTime).toBe('10:00');
      expect(slots[1].endTime).toBe('11:00');
    });

    it('should handle 30-minute slot durations correctly', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T10:00:00';
      const slotDuration = 30;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots[0].startTime).toBe('09:00');
      expect(slots[0].endTime).toBe('09:30');
      expect(slots[1].startTime).toBe('09:30');
      expect(slots[1].endTime).toBe('10:00');
    });
  });

  describe('Edge cases', () => {
    it('should handle same start and end date', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T09:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots.length).toBe(0); // No complete slots fit
    });

    it('should handle very short time range', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T09:30:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots.length).toBe(0); // 60-min slot doesn't fit in 30-min window
    });

    it('should handle 15-minute slots', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T10:00:00';
      const slotDuration = 15;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots.length).toBe(4); // 4 x 15min = 60min
    });

    it('should handle 2-hour slots', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T13:00:00';
      const slotDuration = 120;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots.length).toBe(2); // 09:00-11:00, 11:00-13:00
    });

    it('should handle zero capacity slots', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T10:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 0;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots[0].remainingCapacity).toBe(0);
    });

    it('should handle very large capacity', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T10:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 10000;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots[0].remainingCapacity).toBe(10000);
    });
  });

  describe('Date handling', () => {
    it('should include full end day when endDate is end of day', () => {
      const startDate = '2026-05-01T00:00:00';
      const endDate = '2026-05-01T23:59:59';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      // Should have slots throughout the day
      expect(slots.length).toBe(24); // 24 hours of 60-min slots
    });

    it('should handle dates across month boundary', () => {
      const startDate = '2026-05-31T09:00:00';
      const endDate = '2026-06-01T17:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots.length).toBeGreaterThan(0);

      // Check that both months are represented
      const maySlots = slots.filter(s => new Date(s.date).getMonth() === 4);
      const juneSlots = slots.filter(s => new Date(s.date).getMonth() === 5);

      expect(maySlots.length).toBeGreaterThan(0);
      expect(juneSlots.length).toBeGreaterThan(0);
    });

    it('should store date as Date object', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T10:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      expect(slots[0].date).toBeInstanceOf(Date);
    });

    it('should normalize date to midnight (00:00:00)', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T10:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      const slotDate = slots[0].date;
      expect(slotDate.getHours()).toBe(0);
      expect(slotDate.getMinutes()).toBe(0);
      expect(slotDate.getSeconds()).toBe(0);
    });
  });

  describe('Slot continuity', () => {
    it('should generate continuous slots without gaps', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T13:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      for (let i = 0; i < slots.length - 1; i++) {
        expect(slots[i].endTime).toBe(slots[i + 1].startTime);
      }
    });

    it('should not overlap slots', () => {
      const startDate = '2026-05-01T09:00:00';
      const endDate = '2026-05-01T12:00:00';
      const slotDuration = 60;
      const capacityPerSlot = 100;

      const slots = generateSlots(startDate, endDate, slotDuration, capacityPerSlot);

      for (let i = 0; i < slots.length - 1; i++) {
        const currentEnd = slots[i].endTime;
        const nextStart = slots[i + 1].startTime;

        // Convert to minutes for comparison
        const [endHour, endMin] = currentEnd.split(':').map(Number);
        const [startHour, startMin] = nextStart.split(':').map(Number);

        const endMinutes = endHour * 60 + endMin;
        const startMinutes = startHour * 60 + startMin;

        expect(endMinutes).toBeLessThanOrEqual(startMinutes);
      }
    });
  });
});
