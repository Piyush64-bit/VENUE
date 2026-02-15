describe('Event Module (Public)', () => {
  describe('GET /api/events', () => {
    it('should return all events', async () => {
      await Event.create({ /* valid event */ });
      const res = await request(app).get('/api/events');
      expect(res.status).toBe(200);
    });

    it('should filter by date range', async () => {
      const res = await request(app)
        .get('/api/events?dateFrom=2026-03-01&dateTo=2026-04-01');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event details', async () => {
      const event = await Event.create({ /* ... */ });
      const res = await request(app).get(`/api/events/${event._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.event._id).toBe(event._id.toString());
    });
  });
});