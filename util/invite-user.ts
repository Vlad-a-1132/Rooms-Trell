import checkEnvironment from '@/util/check-environment';

/**
 * Отправляет запрос на добавление пользователя в доску по приглашению
 * @param {Object} params - Параметры для приглашения
 * @param {string} params.email - Email пользователя, которого приглашают
 * @param {string} params.boardId - ID доски, в которую приглашают
 * @returns {Promise<boolean>} - true если приглашение успешно обработано, false в противном случае
 */
const inviteUser = async ({ email, boardId }) => {
  try {
    const host = checkEnvironment();
    const URL = `${host}/api/invite-user`;
    const data = {
      email,
      boardId
    };

    console.log('Sending invite request:', data);

    const response = await fetch(URL, {
      method: 'PATCH',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(data)
    });

    const json = await response.json();
    console.log('Invite response:', json);

    // Проверяем успешный статус
    if (response.ok && (json.status === 200 || json.success)) {
      return true;
    } else {
      console.error('Invitation failed:', json.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('Error inviting user:', error);
    return false;
  }
};

export default inviteUser;
