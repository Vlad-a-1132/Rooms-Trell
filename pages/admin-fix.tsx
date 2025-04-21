import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Input,
  FormControl,
  FormLabel,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import withAuth from '@/src/hoc/with-auth';
import withStore from '@/src/hoc/with-store';
import withSidebar from '@/src/hoc/with-sidebar';
import checkEnvironment from '@/util/check-environment';

const AdminFix = () => {
  const [boardId, setBoardId] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const host = checkEnvironment();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!boardId || !userId) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, введите ID доски и ID пользователя',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`${host}/api/fix-board-users?boardId=${boardId}&targetUserId=${userId}`);
      const data = await response.json();
      
      if (data.status === 200) {
        toast({
          title: 'Успешно',
          description: data.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Очищаем форму
        setBoardId('');
        setUserId('');
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
    } finally {
      setLoading(false);
    }
  };

  const goToCheckInvitations = () => {
    router.push('/check-invitations');
  };

  const goToBoards = () => {
    router.push('/boards');
  };

  return (
    <Box p={5}>
      <Heading mb={4}>Админ-панель: добавление пользователя в доску</Heading>
      <Text mb={4}>Используйте эту страницу для ручного добавления пользователя в доску</Text>
      
      <VStack as="form" spacing={4} align="flex-start" onSubmit={handleSubmit}>
        <FormControl isRequired>
          <FormLabel>ID доски</FormLabel>
          <Input 
            value={boardId} 
            onChange={(e) => setBoardId(e.target.value)} 
            placeholder="Введите ID доски" 
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>ID пользователя</FormLabel>
          <Input 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
            placeholder="Введите ID пользователя" 
          />
        </FormControl>
        
        <Button 
          type="submit" 
          colorScheme="blue" 
          isLoading={loading}
          loadingText="Добавление..."
        >
          Добавить пользователя в доску
        </Button>
      </VStack>
      
      <Box mt={8}>
        <Button onClick={goToCheckInvitations} mr={4}>
          Перейти к проверке приглашений
        </Button>
        <Button onClick={goToBoards} colorScheme="green">
          Вернуться к доскам
        </Button>
      </Box>
    </Box>
  );
};

const AdminFixWithSidebar = withSidebar(AdminFix, { page: 'admin-fix' });
const AdminFixWithAuth = withAuth(AdminFixWithSidebar);
const AdminFixWithStore = withStore(AdminFixWithAuth);

export default AdminFixWithStore; 