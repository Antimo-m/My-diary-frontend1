function partsInTimeZone(date, timeZone) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      month: '2-digit',
      timeZone,
      year: 'numeric',
    })
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  )
}

export function currentDateInTimeZone(timeZone, date = new Date()) {
  const { day, month, year } = partsInTimeZone(date, timeZone)

  return `${year}-${month}-${day}`
}

export function currentTimeInTimeZone(timeZone, date = new Date()) {
  const { hour, minute } = partsInTimeZone(date, timeZone)

  return `${hour === '24' ? '00' : hour}:${minute}`
}

export function clockPart(value) {
  return value ? value.slice(0, 5) : ''
}
