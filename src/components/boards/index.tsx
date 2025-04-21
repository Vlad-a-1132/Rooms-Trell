import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalOverlay,
  useDisclosure,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  Input,
  Text,
  Heading,
  Divider,
  Flex,
  Tooltip
} from '@chakra-ui/react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/src/hooks';
import { updateBoardDetail, resetBoard } from '@/src/slices/board';
import { createBoard, fetchBoards } from '@/src/slices/boards';
import { AiOutlinePlus, AiOutlineReload } from 'react-icons/ai';

import shortId from 'shortid';

const Boards = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const boards = useAppSelector((state) => state.boards.boards);
  const userId = useAppSelector((state) => state.user.id);

  const dispatch = useDispatch();
  const board = useAppSelector((state) => state.board.board);

  const boardRequest = useAppSelector((state) => state.boards.isRequesting);

  // Разделяем доски на личные и доски, к которым пользователь приглашен
  const personalBoards = boards.filter(board => String(board.createdBy) === String(userId));
  
  // Улучшенная логика для поиска приглашенных досок
  const invitedBoards = boards.filter(board => {
    // Если это личная доска, пропускаем
    if (String(board.createdBy) === String(userId)) {
      return false;
    }
    
    // Проверяем наличие пользователя в массиве users
    if (!board.users) {
      return false;
    }
    
    // Преобразуем ID пользователя и все ID в массиве users в строки для корректного сравнения
    const userIdStr = String(userId);
    const userIds = Array.isArray(board.users) 
      ? board.users.map(id => String(id))
      : [];
    
    return userIds.includes(userIdStr);
  });

  // Отладочный вывод
  useEffect(() => {
    console.log('userId:', userId);
    console.log('All boards:', boards);
    console.log('Personal boards:', personalBoards);
    console.log('Invited boards:', invitedBoards);
    
    // Проверка на корректность фильтрации
    if (boards.length > 0) {
      boards.forEach(board => {
        console.log(`Board ${board.name}:`, {
          id: board._id,
          createdBy: board.createdBy,
          users: board.users || []
        });
      });
    }
  }, [boards, userId]);

  const handleCreate = async () => {
    const id = shortId.generate();
    const date = new Date().toLocaleString();

    dispatch(updateBoardDetail({ type: '_id', value: id }));
    dispatch(updateBoardDetail({ type: 'dateCreated', value: date }));

    await dispatch(createBoard());
    await dispatch(fetchBoards());
    await dispatch(resetBoard());

    onClose();
  };

  const handleChange = (e) => {
    const data = {
      type: 'name',
      value: e.target.value
    };

    dispatch(updateBoardDetail(data));
  };

  const handleRefresh = async () => {
    console.log("Refreshing boards...");
    try {
      // Сбрасываем состояние досок перед загрузкой
      dispatch({ type: 'boards/resetBoards' });
      
      // Загружаем доски заново
      const result = await dispatch(fetchBoards());
      
      console.log("Boards refreshed:", result);
      
      // Получаем обновленные доски
      const refreshedBoards = result.payload;
      console.log("Updated boards count:", refreshedBoards?.length || 0);
      
      if (refreshedBoards?.length > 0) {
        // Проверяем, есть ли доски с текущим пользователем в users
        const sharedBoardsCount = refreshedBoards.filter(
          board => board.createdBy !== userId && board.users?.includes(userId)
        ).length;
        
        console.log("Shared boards count:", sharedBoardsCount);
      }
    } catch (error) {
      console.error("Error refreshing boards:", error);
    }
  };

  const createBoardModal = () => {
    return (
      <Flex justifyContent="space-between" alignItems="center">
        <Button
          onClick={onOpen}
          leftIcon={<AiOutlinePlus />}
          colorScheme="green"
          size="lg"
          mt="1rem">
          Create a board
        </Button>
        
        <Tooltip label="Refresh boards list" placement="top">
          <Button
            onClick={handleRefresh}
            leftIcon={<AiOutlineReload />}
            colorScheme="blue"
            variant="outline"
            size="md"
            mt="1rem"
            isLoading={boardRequest}>
            Refresh
          </Button>
        </Tooltip>
      </Flex>
    );
  };

  const renderBoardsList = (boardsList, title = '') => {
    if (!boardsList || boardsList.length === 0) {
      return title ? (
        <>
          <Heading as="h3" size="md" mt="2rem">{title}</Heading>
          <Text color="gray.500" mt="1rem">No boards found</Text>
        </>
      ) : null;
    }

    return (
      <>
        {title && <Heading as="h3" size="md" mt="2rem">{title}</Heading>}
        <Box mt="1rem" display="flex" flexWrap="wrap">
          {boardsList.map((board, index) => (
            <Link
              key={index}
              href={{
                pathname: '/boards/[slug]',
                query: { slug: board._id }
              }}>
              <Box
                mr="1rem"
                mt="1rem"
                height="150px"
                width="150px"
                background={`linear-gradient(
                  rgba(0, 0, 0, 0.4),
                  rgba(0, 0, 0, 0.4)
                ),
                url(${board.backgroundImage})`}
                backgroundPosition="center"
                backgroundRepeat="no-repeat"
                backgroundSize="cover"
                borderRadius="5px"
                boxShadow="lg"
                cursor="pointer">
                <Text
                  marginTop="calc(50% - 25px)"
                  height="25px"
                  textAlign="center"
                  textTransform="capitalize"
                  color="white"
                  fontSize="20px"
                  fontWeight="bold">
                  {board.name}
                </Text>
              </Box>
            </Link>
          ))}
        </Box>
      </>
    );
  };

  return (
    <Box flexGrow={3} mx="2%" boxShadow="base" rounded="lg" bg="white" p="1rem">
      {createBoardModal()}
      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create board</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              value={board.name}
              onChange={(e) => handleChange(e)}
              placeholder="Board name"
            />
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCreate} isLoading={boardRequest} loadingText="Creating board">
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {renderBoardsList(personalBoards, "My Boards")}
      {invitedBoards.length > 0 && (
        <>
          <Divider my="2rem" />
          {renderBoardsList(invitedBoards, "Shared With Me")}
        </>
      )}
    </Box>
  );
};

export default Boards;
