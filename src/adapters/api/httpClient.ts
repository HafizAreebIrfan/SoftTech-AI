export const get = async (url: string) => {
  const res = await fetch(url);
  return res.json();
};

export const post = async (url: string, payload: unknown) => {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  });

  return res.json();
};
