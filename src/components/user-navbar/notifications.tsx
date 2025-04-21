import React, { useEffect, useState } from 'react';
import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Text,
  Flex,
  Badge,
  Heading,
  Button,
  Divider,
  useToast
} from '@chakra-ui/react';
import { AiOutlineNotification, AiOutlineCheck, AiOutlineReload } from 'react-icons/ai';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { useAppSelector } from '@/src/hooks';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification
} from '@/src/slices/notifications';

const NotificationsMenu: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const toast = useToast();
  const { items: notifications = [], unreadCount = 0, status } =
    useAppSelector((state) => state.notifications) || {};
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Загружаем уведомления при монтировании компонента
  useEffect(() => {
    loadNotifications();

    // Устанавливаем интервал для периодической проверки новых уведомлений
    const intervalId = setInterval(() => {
      loadNotifications(false);
    }, 30000); // Каждые 30 секунд

    return () => clearInterval(intervalId);
  }, []);

  // Функция для загрузки уведомлений
  const loadNotifications = (showFeedback = true) => {
    try {
      if (showFeedback) {
        setIsRefreshing(true);
      }

      // Просто вызываем dispatch, не пытаемся обработать результат сразу
      dispatch(fetchNotifications());

      // Если нужно показать фидбек, делаем это через небольшую задержку
      if (showFeedback) {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (showFeedback) {
        setIsRefreshing(false);
      }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    try {
      // Проверяем, что notification._id существует
      if (!notification || !notification._id) {
        console.error('Invalid notification object:', notification);
        return;
      }

      console.log('Handling notification click:', notification);

      // Сначала помечаем уведомление как прочитанное
      dispatch(markNotificationAsRead(notification._id));

      // Если уведомление о приглашении в доску, переходим на нее
      if (notification.type === 'board_invite' && notification.boardId) {
        console.log(`Navigating to board: /boards/${notification.boardId}`);

        // Закрываем меню перед навигацией
        setIsMenuOpen(false);

        // Небольшая задержка перед навигацией, чтобы меню успело закрыться
        setTimeout(() => {
          router
            .push(`/boards/${notification.boardId}`)
            .then(() => {
              console.log('Navigation successful');
            })
            .catch((err) => {
              console.error('Navigation error:', err);

              // Если не удалось перейти на доску, показываем ошибку
              toast({
                title: 'Ошибка перехода на доску',
                description: `Не удалось открыть доску. Возможно, у вас нет доступа или доска была удалена.`,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top'
              });
            });
        }, 300);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllAsRead = () => {
    try {
      dispatch(markAllNotificationsAsRead());

      toast({
        title: 'Уведомления прочитаны',
        description: 'Все уведомления помечены как прочитанные',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleRefresh = () => {
    loadNotifications();
  };

  // Убедимся, что notifications - это массив
  const notificationsList = Array.isArray(notifications) ? notifications : [];

  return (
    <Menu
      closeOnSelect={false}
      isOpen={isMenuOpen}
      onOpen={() => setIsMenuOpen(true)}
      onClose={() => setIsMenuOpen(false)}>
      <MenuButton
        as={IconButton}
        aria-label="Notifications"
        icon={<AiOutlineNotification />}
        variant="ghost"
        position="relative"
        mr={2}>
        {unreadCount > 0 && (
          <Badge
            colorScheme="red"
            borderRadius="full"
            position="absolute"
            top="-5px"
            right="-5px"
            fontSize="xs">
            {unreadCount}
          </Badge>
        )}
      </MenuButton>
      <MenuList maxH="400px" overflowY="auto" minW="300px">
        <Flex justifyContent="space-between" alignItems="center" px={3} py={2}>
          <Heading as="h4" size="sm">
            Уведомления
          </Heading>
          <Flex>
            {unreadCount > 0 && (
              <Button
                size="xs"
                onClick={handleMarkAllAsRead}
                leftIcon={<AiOutlineCheck />}
                colorScheme="blue"
                variant="ghost"
                mr={1}>
                Прочитать все
              </Button>
            )}
            <Button
              size="xs"
              onClick={handleRefresh}
              leftIcon={<AiOutlineReload />}
              variant="ghost"
              isLoading={isRefreshing || status === 'loading'}>
              Обновить
            </Button>
          </Flex>
        </Flex>
        <Divider />
        {status === 'loading' && isRefreshing ? (
          <Box p={4} textAlign="center">
            <Text color="gray.500">Загрузка уведомлений...</Text>
          </Box>
        ) : notificationsList.length === 0 ? (
          <Box p={4} textAlign="center">
            <Text color="gray.500">У вас нет уведомлений</Text>
          </Box>
        ) : (
          notificationsList.map((notification, index) => (
            <MenuItem
              key={notification._id || index}
              onClick={() => handleNotificationClick(notification)}
              bg={notification.isRead ? 'transparent' : 'blue.50'}
              _hover={{ bg: notification.isRead ? 'gray.100' : 'blue.100' }}>
              <Box w="100%">
                <Flex justifyContent="space-between" alignItems="flex-start">
                  <Text fontWeight={notification.isRead ? 'normal' : 'bold'}>
                    {notification.message || 'Новое уведомление'}
                  </Text>
                  {!notification.isRead && (
                    <Box ml={2} w={2} h={2} borderRadius="full" bg="blue.500" mt={1} />
                  )}
                </Flex>
                {notification.createdAt && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </Text>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </MenuList>
    </Menu>
  );
};

export default NotificationsMenu;
