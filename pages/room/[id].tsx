import { useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Video, { Room } from 'twilio-video'
import { useDisclosure } from '@chakra-ui/react'

import { getUserProfile } from 'utils/getUserProfile'
import { getToken } from 'utils/getToken'
import { supabase } from 'services/config'
import useParticipant from 'hooks/useParticipants'
import { useVideoContext } from 'context/VideoContext'
import { useRoomContext } from 'context/RoomContext'
import PeopleConnected from 'components/RoomDetails/PeopleConnected'
import VideoCall from 'components/RoomDetails/VideoCall'
import Member from 'components/RoomDetails/Member/'
import LayoutRoomDetails from 'components/Layout/LayoutRoomDetails'
import NotRoomFound from 'components/Errors/NotRoomFound'
import ControlsRoom from 'components/RoomDetails/ControlsRoom'
import CustomModal from 'components/Modal'
import ListRemoteMembers from 'components/RoomDetails/ListRemoteMembers'

type Props = {
  profile: any
  roomId: string
}
// Set video call capacity: https://www.twilio.com/console/video/configure

const RoomDetails = ({ profile, roomId }: Props) => {
  const { room, setRoom } = useVideoContext()
  const { participants } = useParticipant()
  const { roomSelected } = useRoomContext()
  const { isOpen, onOpen, onClose } = useDisclosure()
  //Information of current user logged in
  const { id, full_name } = profile
  const userId = id + '|' + full_name

  useEffect(() => {
    if (roomSelected) {
      // Getting token for first time and then use it to connect to room
      getToken(roomId, userId).then((token) => {
        Video.connect(token, {
          name: roomId
        }).then((room) => {
          setRoom(room)
        })
      })

      return () => {
        setRoom((prevRoom: Room | null) => {
          if (prevRoom) {
            prevRoom.localParticipant.tracks.forEach((trackPublication: any) => {
              trackPublication.track.stop()
            })
            prevRoom.disconnect()
          }
          return null
        })
      }
    }
  }, []) //eslint-disable-line react-hooks/exhaustive-deps

  if (!roomSelected) return <NotRoomFound roomId={roomId} />

  return (
    <>
      <LayoutRoomDetails>
        <VideoCall full_name={full_name}>
          {room && (
            <>
              {/* This is local member  */}
              <Member member={room?.localParticipant} />
              {/* List of remote members */}
              <ListRemoteMembers participants={participants} />
            </>
          )}
        </VideoCall>
      </LayoutRoomDetails>
      {room && <ControlsRoom onOpen={onOpen} />}
      <CustomModal title={`Participants: ${participants.length}`} isOpen={isOpen} onClose={onClose}>
        <PeopleConnected participants={participants} />
      </CustomModal>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
  const { user } = await supabase.auth.api.getUserByCookie(req)
  const profile = getUserProfile(user)
  if (!user) {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  return { props: { profile: profile, roomId: query.id } }
}

export default RoomDetails
