// https://github.com/FurryApp/event-schedule-schema

// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { APIRoute } from 'astro'
import { type CollectionEntry, getCollection } from 'astro:content'
import { start_con } from '../../../data/reg/dates.json'
import { timezone_identifier } from '../../../data/con/timezone.json'

const raw_tags = await getCollection('scheduleTags')
const raw_locations = await getCollection('scheduleLocations')
const raw_events = await getCollection('scheduleEvents')
const raw_open_locations = await getCollection('scheduleOpenLocations')

const offset = start_con.split('+')[1] // assumes the con happens entirely in the same offset

const con_slug = 'fluufff'
const con_name = 'Flüüfff'

const venue_slug = 'pullman-antwerp'
const venue_name = 'Pullman Antwerp'

function get_host_id_from_host_name(host_name: string) {
  return host_name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}

const raw_hosts: CollectionEntry<'scheduleHosts'> = []
raw_events.map((event: any) => {
  const host_name: string = event.data.host_name
  if (!host_name) return

  const host_id = get_host_id_from_host_name(host_name)
  if (raw_hosts.some((raw_host: any) => raw_host.id == host_id)) return

  raw_hosts.push({
    id: host_id,
    data: {
      name: host_name
    }
  })
})

function en_US(string: string) {
  return {
    'en-US': string
  }
}

export const GET: APIRoute = () => {
  const data = {
    schemaVersion: '1.0.0',
    updatedAt: new Date().toISOString(),
    event: {
      id: con_slug,
      displayName: en_US(con_name),
      startTime: `2026-11-11T00:00:00.000+${offset}`,
      endTime: `2026-11-15T23:59:59.999+${offset}`,
      timezone: timezone_identifier
    },
    membershipLevels: [],
    tracks: [],
    sessionTypes: [],
    labels: raw_tags.map((raw_tag: any) => {
      return {
        id: raw_tag.id,
        displayName: en_US(raw_tag.data.name),
        description: en_US(raw_tag.data.description)
      }
    }),
    venues: [
      {
        id: venue_slug,
        displayName: en_US(venue_name)
      }
    ],
    rooms: raw_locations.map((raw_location: any) => {
      return {
        id: raw_location.id,
        displayName: en_US(raw_location.data.name),
        venueId: venue_slug
      }
    }),
    hosts: raw_hosts.map((raw_host: any) => {
      return {
        id: raw_host.id,
        displayName: raw_host.data.name
      }
    }),
    sessions: raw_events.map((raw_event: any) => {
      const tags_string =
        raw_event.data.schedule_tags.length > 0
          ? `\n---\n` + raw_event.data.schedule_tags.map((schedule_tag: any) => `- ${schedule_tag.name}`).join('\n')
          : ''
      return {
        id: raw_event.id,
        displayName: en_US(raw_event.data.title),
        description: en_US(raw_event.data.description + tags_string),
        timeSlots: [
          {
            startTime: `${raw_event.data.day}T${raw_event.data.start_time}+${offset}`,
            endTime: `${raw_event.data.day}T${raw_event.data.end_time}+${offset}`,
            roomIds: raw_event.data.schedule_location ? [raw_event.data.schedule_location.id] : [],
            hostIds: raw_event.data.host_name ? [get_host_id_from_host_name(raw_event.data.host_name)] : [],
            labelIds: raw_event.data.schedule_tags.map((schedule_tag: any) => schedule_tag.id)
          }
        ]
      }
    })
  }

  raw_open_locations.forEach((raw_open_location: any) => {
    data.sessions.push({
      id: raw_open_location.id,
      displayName: en_US(raw_open_location.data.name),
      description: en_US(raw_open_location.data.description),
      timeSlots: raw_open_location.data.opening_times.map((opening_time: any) => {
        return {
          startTime: `${opening_time.day}T${opening_time.start_time}+${offset}`,
          endTime: `${opening_time.day}T${opening_time.end_time}+${offset}`,
          roomIds: [],
          hostIds: [get_host_id_from_host_name(con_name)],
          labelIds: []
        }
      })
    })
  })

  // hijacks the format to show the start & end times under the session name in front of the location within the barq app
  data.sessions.forEach((session: any) => {
    session.timeSlots.forEach((timeslot: any) => {
      const start_hour_and_minute = /T(\d\d:\d\d)/.exec(timeslot.startTime)![1]
      const end_hour_and_minute = /T(\d\d:\d\d)/.exec(timeslot.endTime)![1]
      const room_id = `${session.id} (${timeslot.startTime} - ${timeslot.endTime})` // unique id

      if (timeslot.roomIds.length == 0) {
        // if there are no rooms, just show the start and end time
        data.rooms.push({
          id: room_id,
          displayName: en_US(`${start_hour_and_minute} - ${end_hour_and_minute}`),
          venueId: venue_slug
        })
        timeslot.roomIds[0] = room_id
      } else {
        // if there are rooms, show the start and end time in front of just the first one
        const first_room = data.rooms.find((room: any) => room.id == timeslot.roomIds[0])
        data.rooms.push({
          id: room_id,
          displayName: en_US(`${start_hour_and_minute} - ${end_hour_and_minute} @ ${first_room.displayName['en-US']}`),
          venueId: venue_slug
        })
        timeslot.roomIds[0] = room_id
      }
    })
  })

  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json'
    }
  })
}
