
async function RecentChats() {
  const data = await fetch('/api/v1/chat/recent-chats',{
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const response = await data.json();
 return response


 }

 export { RecentChats };