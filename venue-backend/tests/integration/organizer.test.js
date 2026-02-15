describe('Organizer Module', () => {
  let organizerToken, organizerId;

  beforeEach(async () => {
    const organizer = await User.create({
      name: 'Organizer',
      email: 'organizer@test.com',
      password: 'hashedpass',
      role: 'organizer'
    });
    organizerToken = generateToken(organizer);
    organizerId = organizer._id;
  });

  describe('POST /api/organizers/events', () => {
    it('should create event', async () => {
      const res = await request(app)
        .post('/api/organizers/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Concert',
          description: 'Live music',
          date: '2026-03-01',
          venue: 'Stadium',
          ticketsAvailable: 100,
          price: 50
        });
      expect(res.status).toBe(201);
      expect(res.body.data.event.title).toBe('Concert');
    });

    it('should reject invalid dates', async () => {
      const res = await request(app)
        .post('/api/organizers/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ date: '2020-01-01' }); // past date
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/organizers/events', () => {
    it('should list organizer events', async () => {
      await Event.create({ /* ... */ organizer: organizerId });
      const res = await request(app)
        .get('/api/organizers/events')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(res.status).toBe(200);
    });
  });

  // Add PATCH, DELETE, analytics endpoints...
});