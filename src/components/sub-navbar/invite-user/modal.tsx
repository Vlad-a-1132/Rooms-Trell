import React, { useState } from 'react';
import {
  Modal,
  ModalBody,
  ModalOverlay,
  ModalCloseButton,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  useToast,
  Text,
  Box
} from '@chakra-ui/react';
import checkEnvironment from '@/util/check-environment';
import { useAppSelector } from '@/src/hooks';

const host = checkEnvironment();

const InviteModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState(false);
  const [isMailSending, setMailSending] = useState(false);
  const board = useAppSelector((state) => state.board.board);
  const toast = useToast();

  const validEmail = new RegExp('^[a-zA-Z0-9._:$!%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]$');

  const handleClick = async () => {
    setMailSending(true);
    try {
      const result = await sendEmail();
      console.log('Complete invitation result:', result);

      if (result.success) {
        // Показываем соответствующее сообщение в зависимости от того, был ли отправлен email
        if (result.emailSent) {
          toast({
            title: 'Приглашение отправлено!',
            description: `Приглашение на ${email} успешно отправлено. Пользователь также получит уведомление при входе в систему.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
            position: 'top'
          });
        } else {
          toast({
            title: 'Приглашение создано',
            description: `Не удалось отправить email на ${email}, но приглашение создано. Пользователь получит уведомление при входе в систему.`,
            status: 'warning',
            duration: 8000,
            isClosable: true,
            position: 'top'
          });
        }
        onClose();
        setEmail('');
      } else {
        toast({
          title: 'Ошибка отправки приглашения',
          description:
            result.message ||
            'Произошла ошибка при отправке приглашения. Пожалуйста, попробуйте снова.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Ошибка отправки приглашения',
        description: 'Произошла ошибка при отправке приглашения. Пожалуйста, попробуйте снова.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setMailSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    validate(e.target.value);
  };

  const validate = (value = email) => {
    if (!validEmail.test(value)) {
      setEmailErr(true);
      return false;
    } else {
      setEmailErr(false);
      return true;
    }
  };

  const sendEmail = async () => {
    try {
      if (!board || !board._id) {
        console.error('Board ID is missing');
        return { success: false, message: 'ID доски отсутствует' };
      }

      const url = `${host}/api/mail`;

      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ email, boardId: board._id })
      });

      const data = await response.json();
      console.log('Invitation response:', data);

      if (response.ok && data.status === 200) {
        return {
          success: true,
          emailSent: data.emailSent,
          notificationCreated: data.notificationCreated
        };
      } else {
        return {
          success: false,
          message: data.message || 'Ошибка при отправке приглашения'
        };
      }
    } catch (error) {
      console.error('Error in sendEmail:', error);
      return { success: false, message: 'Ошибка сети при отправке приглашения' };
    }
  };

  return (
    <>
      <Button onClick={onOpen} size="xs" ml="5px">
        Invite
      </Button>
      <Modal onClose={onClose} isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Invite User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="Enter email to invite"
            />
            {emailErr && (
              <Text color="red.500" fontSize="sm" mt={1}>
                Please enter a valid email address
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              disabled={!validEmail.test(email)}
              colorScheme="blue"
              mr={3}
              onClick={handleClick}
              isLoading={isMailSending}
              loadingText="Sending">
              Invite
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default InviteModal;
