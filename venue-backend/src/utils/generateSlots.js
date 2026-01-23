/**
 * Generate slots for an event day-wise and time-wise
 */
const generateSlots = (startDate, endDate, slotDuration, capacityPerSlot) => {
  const slots = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  // 🔥 IMPORTANT FIX: include full end day
  end.setHours(23, 59, 59, 999);

  for (
    let currentDate = new Date(start);
    currentDate <= end;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    for (let hours = 0; hours < 24; hours++) {
      for (let minutes = 0; minutes < 60; minutes += slotDuration) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(hours, minutes, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

        if (slotStart >= start && slotEnd <= end) {
          slots.push({
            date: new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate()
            ),
            startTime: slotStart.toTimeString().slice(0, 5),
            endTime: slotEnd.toTimeString().slice(0, 5),
            remainingCapacity: capacityPerSlot,
            status: "AVAILABLE",
          });
        }
      }
    }
  }

  return slots;
};

module.exports = generateSlots;
