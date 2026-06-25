Deno.serve(async (req) => {
  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    if (!clientIP || clientIP === 'unknown') {
      return Response.json({ city: 'תל אביב' });
    }

    // Use ip-api.com for geolocation (free tier available)
    const response = await fetch(`https://ip-api.com/json/${clientIP}?fields=city,country,status`, {
      method: 'GET'
    });

    const data = await response.json();

    if (data.status === 'success' && data.city) {
      return Response.json({ city: data.city });
    }

    return Response.json({ city: 'תל אביב' });
  } catch (error) {
    return Response.json({ city: 'תל אביב' });
  }
});