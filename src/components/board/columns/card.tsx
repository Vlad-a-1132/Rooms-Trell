import React, { FC, useMemo } from 'react';
import { Box, Badge, Avatar, Flex, Image } from '@chakra-ui/react';
import { Draggable } from 'react-beautiful-dnd';
import { CardDetail } from '@/src/types/cards';
import { useAppSelector } from '@/src/hooks';
import { GrDrag } from 'react-icons/gr';

type Props = {
  showCardDetail: (cardId: string) => void;
  cardIndex: number;
  card: CardDetail;
};

const Card: FC<Props> = ({ cardIndex, showCardDetail, card }) => {
  const users = useAppSelector((state) => state.users.users);

  const extractFirstImage = useMemo(() => {
    if (!card.description || typeof window === 'undefined') return null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(card.description, 'text/html');
      const img = doc.querySelector('img');
      return img ? img.src : null;
    } catch (error) {
      console.error('Error parsing description:', error);
      return null;
    }
  }, [card.description]);

  const loadAssignedToUser = () => {
    if (!card.assignedTo) return;

    const user = users.filter((user) => user._id === card.assignedTo);

    return (
      <Box display="flex" justifyContent="flex-end">
        <Avatar size="xs" name={user[0]?.fullName} />
      </Box>
    );
  };

  return (
    <Draggable draggableId={card._id} index={cardIndex}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          m="5px"
          p="10px"
          id={card._id}
          minHeight="80px"
          borderWidth="1px"
          bg={snapshot.isDragging ? 'gray.100' : 'white'}
          cursor="pointer"
          borderRadius="md"
          boxShadow={snapshot.isDragging ? 'lg' : 'none'}
          _hover={{
            backgroundColor: 'lightblue'
          }}
          onClick={() => showCardDetail(card._id)}>
          <Flex align="center" mb={2}>
            <Box {...provided.dragHandleProps} mr={2} cursor="grab">
              <GrDrag />
            </Box>
            {card.label && (
              <Badge bg={card.label.type} color="white">
                {card.label.type}
              </Badge>
            )}
          </Flex>
          <Box>
            <p>{card.title}</p>
          </Box>
          {extractFirstImage && (
            <Box mt={2} position="relative" height="120px">
              <Image
                width="100%"
                height="100%"
                src={extractFirstImage}
                alt="Card preview"
                objectFit="cover"
                borderRadius="md"
              />
            </Box>
          )}
          <Box mt={2}>{loadAssignedToUser()}</Box>
        </Box>
      )}
    </Draggable>
  );
};

export default Card;
