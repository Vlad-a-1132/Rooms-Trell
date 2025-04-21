import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Stack,
  Divider,
  useToast
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import withAuth from '@/src/hoc/with-auth';
import withStore from '@/src/hoc/with-store';
import withSidebar from '@/src/hoc/with-sidebar';
import { useAppSelector } from '@/src/hooks';
import checkEnvironment from '@/util/check-environment';

const CheckInvitations = () => {
  const [boards, setBoards] = useState([]);
  const [personalBoards, setPersonalBoards] = useState([]);
  const [invitedBoards, setInvitedBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();
  const userId = useAppSelector((state) => state.user.id);
  const host = checkEnvironment();

  // Загрузка данных о досках
  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${host}/api/debug-boards`);
      const data = await response.json();
      console.log('Debug data:', data);
      
      setBoards(data.allBoards || []);
      setPersonalBoards(data.personalBoards || []);
      setInvitedBoards(data.invitedBoards || []);
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить доски',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Добавление пользователя в доску
  const addUserToBoard = async (boardId) => {
    try {
      const response = await fetch(`${host}/api/fix-invitation?boardId=${boardId}`);
      const data = await response.json();
      console.log('Fix result:', data);
      
      if (data.status === 200) {
        toast({
          title: 'Успешно',
          description: data.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Обновляем список досок
        await fetchBoards();
      } else {
        toast({
          title: 'Ошибка',
          description: data.message || 'Не удалось добавить пользователя в доску',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error adding user to board:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить пользователя в доску',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Переход на страницу досок
  const goToBoards = () => {
    router.push('/boards');
  };

  return (
    <Box p={5}>
      <Heading mb={4}>Проверка приглашений в доски</Heading>
      <Text mb={4}>Используйте эту страницу для проверки и исправления приглашений в доски</Text>
      
      <Flex mb={4}>
        <Button colorScheme="blue" mr={2} onClick={fetchBoards} isLoading={loading}>
          Обновить данные
        </Button>
        <Button colorScheme="green" onClick={goToBoards}>
          Вернуться к доскам
        </Button>
      </Flex>
      
      <Divider my={6} />
      
      <Text>ID текущего пользователя: {userId}</Text>
      
      <Heading size="md" mt={6} mb={3}>Личные доски ({personalBoards.length})</Heading>
      {personalBoards.length === 0 ? (
        <Text color="gray.500">У вас нет личных досок</Text>
      ) : (
        <Stack spacing={3}>
          {personalBoards.map(board => (
            <Box key={board.id} p={3} shadow="md" borderWidth="1px" borderRadius="md">
              <Heading size="sm">{board.name}</Heading>
              <Text fontSize="sm">ID: {board.id}</Text>
            </Box>
          ))}
        </Stack>
      )}
      
      <Heading size="md" mt={6} mb={3}>Доски с приглашениями ({invitedBoards.length})</Heading>
      {invitedBoards.length === 0 ? (
        <Text color="gray.500">У вас нет приглашений в доски</Text>
      ) : (
        <Stack spacing={3}>
          {invitedBoards.map(board => (
            <Box key={board.id} p={3} shadow="md" borderWidth="1px" borderRadius="md">
              <Heading size="sm">{board.name}</Heading>
              <Text fontSize="sm">ID: {board.id}</Text>
            </Box>
          ))}
        </Stack>
      )}
      
      <Divider my={6} />
      
      <Heading size="md" mt={6} mb={3}>Все доски в системе ({boards.length})</Heading>
      <Stack spacing={4}>
        {boards.map(board => (
          <Box key={board.id} p={4} shadow="md" borderWidth="1px" borderRadius="md">
            <Heading size="sm">{board.name}</Heading>
            <Text fontSize="sm">ID: {board.id}</Text>
            <Text fontSize="sm">Создатель: {board.createdBy}</Text>
            <Text fontSize="sm">Пользователи: {board.users.join(', ') || 'нет'}</Text>
            <Button 
              size="sm" 
              colorScheme="blue" 
              mt={2} 
              onClick={() => addUserToBoard(board.id)}
              isDisabled={board.users.includes(userId)}
            >
              {board.users.includes(userId) ? 'Вы уже добавлены' : 'Добавить себя в доску'}
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const CheckInvitationsWithSidebar = withSidebar(CheckInvitations, { page: 'check-invitations' });
const CheckInvitationsWithAuth = withAuth(CheckInvitationsWithSidebar);
const CheckInvitationsWithStore = withStore(CheckInvitationsWithAuth);

export default CheckInvitationsWithStore; 