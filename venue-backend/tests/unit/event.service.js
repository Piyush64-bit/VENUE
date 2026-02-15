const eventService = require('../../src/modules/events/event.service');
const Event = require('../../src/modules/events/event.model');

jest.mock('../../src/modules/events/event.model');

describe('Event Service', () => {
  afterEach(() => jest.clearAllMocks());

  it('should create event with valid data', async () => {
    Event.create.mockResolvedValue({ _id: '123', title: 'Concert' });
    const result = await eventService.createEvent({ /* data */ });
    expect(result.title).toBe('Concert');
  });

  it('should throw error for duplicate event', async () => {
    Event.create.mockRejectedValue({ code: 11000 });
    await expect(eventService.createEvent({})).rejects.toThrow();
  });
});