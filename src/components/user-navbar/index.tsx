import React, { FC, useEffect } from 'react';
import {
  Button,
  Box,
  Spacer,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Avatar,
  Text,
  Flex
} from '@chakra-ui/react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import { useAppSelector } from '@/src/hooks';
import { useDispatch } from 'react-redux';
import { AiOutlineHome } from 'react-icons/ai';
import { SiTrello } from 'react-icons/si';
import NotificationsMenu from './notifications';
import { fetchNotifications } from '@/src/slices/notifications';

const UserNavBar: FC = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useDispatch();

  // Проверяем наличие уведомлений при загрузке страницы
  useEffect(() => {
    if (user?.isValid) {
      try {
        // Убеждаемся, что у нас есть user_id в cookie для API запросов
        const userIdCookie = document.cookie.split('; ').find((row) => row.startsWith('user_id='));

        if (!userIdCookie) {
          // Если cookie отсутствует, создаем её
          document.cookie = `user_id=${user.id}; path=/; max-age=86400`;
        }

        // Загружаем уведомления
        console.log('Loading notifications for user:', user.id);
        dispatch(fetchNotifications());
      } catch (error) {
        console.error('Error fetching notifications on load:', error);
      }
    }
  }, [user?.isValid, user?.id, dispatch]);

  const logout = async () => {
    const URL = '/api/logout';

    const response = await fetch(URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({})
    });

    const responseInJson = await response.json();

    if (responseInJson.message === 'success') {
      window.location.href = `${window.location.origin}/login`;
    }
  };

  const renderButtons = () => {
    if (user?.isValid) {
      return (
        <Flex alignItems="center">
          <NotificationsMenu />
          <Menu>
            <MenuButton size="xs" mr="5px">
              <Avatar
                size="sm"
                name={user?.fullName}
                color="white"
                src="https://bit.ly/tioluwani-kolawole"
              />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={logout}>Log out</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      );
    }

    return (
      <>
        <Button fontSize="20" color="brand" variant="link" float="right" mr="2" pr="2">
          <Link href="/login">Log in</Link>
        </Button>
        <Button fontSize="md" colorScheme="green" color="white" m="4">
          <Link href="/signup">Sign up</Link>
        </Button>
      </>
    );
  };

  return (
    <Box boxShadow="sm" bg="rgba(0,0,0,0.2)" display="flex">
      <Link href="/home">
        <Button size="xs" ml="5px" my="5px">
          <AiOutlineHome />
        </Button>
      </Link>
      <Link href="/boards">
        <Button size="xs" ml="5px" mr="10px" my="5px">
          Boards
        </Button>
      </Link>
      <Spacer />
      <Box size="md" m="10px" color="white">
        <SiTrello />
      </Box>
      <Text fontWeight="bold" fontSize="20px" mt="2px" color="white">
        Trello clone
      </Text>
      <Spacer />
      {renderButtons()}
    </Box>
  );
};

UserNavBar.propTypes = {
  bg: PropTypes.string
};

export default UserNavBar;
