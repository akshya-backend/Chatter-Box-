  async function fetchGroupInfo(groupID) {
    try {
        const response = await fetch("/api/v1/chat/group-info", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ groupID }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching group info:", error);
        throw error;
    }
    
  }
  export default fetchGroupInfo;