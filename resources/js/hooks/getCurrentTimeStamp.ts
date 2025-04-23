export const getCurrentTimestamp = () => {
    const now = new Date();
    
    const pad = (num: number) => num.toString().padStart(2, '0');
  
    // Lấy thời gian của giờ Việt Nam (UTC+7) bằng cách tạo đối tượng Date với đúng giờ UTC+7.
    const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  
    return `${vnTime.getFullYear()}_${pad(vnTime.getMonth() + 1)}_${pad(vnTime.getDate())}_${pad(vnTime.getHours())}_${pad(vnTime.getMinutes())}_${pad(vnTime.getSeconds())}`;
  };