 export async function grouplistData(){
    const response =  await fetch("/api/v1/chat/group-list", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }}
    )

     const res= await response.json();
     console.log(res);
     
     if(!res.status) return []
     return res.data
 }

 