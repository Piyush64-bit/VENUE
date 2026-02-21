/**
 * Generate slots for an event day-wise and time-wise
 */
const generateSlots = (startDate, endDate, slotDuration, capacityPerSlot) => {
  const slots = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Guard against invalid inputs
  if (start >= end || slotDuration <= 0) return slots;

  let slotStart = new Date(start);

  while (true) {
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

    if (slotEnd > end) break;

    slots.push({
      date: new Date(
        slotStart.getFullYear(),
        slotStart.getMonth(),
        slotStart.getDate()
      ),
      startTime: slotStart.toTimeString().slice(0, 5),
      endTime: slotEnd.toTimeString().slice(0, 5),
      remainingCapacity: capacityPerSlot,
      status: "AVAILABLE",
    });

    slotStart = new Date(slotEnd);
  }

  return slots;
};

module.exports = generateSlots;
