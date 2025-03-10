exports.getPathId = (event, resourceName, mandatory = false) => {
  if (event.pathParameters && event.pathParameters.id !== undefined) {
    return { id: decodeURIComponent(event.pathParameters.id) };
  }

  if (event.rawUrl) {
    const path = event.rawUrl;
    const regex = new RegExp(`/${resourceName}/([^/]+)$`);
    const match = path.match(regex);

    if (match) {
      return { id: decodeURIComponent(match[1]) };
    }
  }

  if (mandatory) {
    return {
      error: `Invalid path: ${event.path || event.rawUrl || 'Unknown path'}`,
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: `${
          resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
        } ID is required in path`,
      }),
    };
  } else {
    return { id: undefined };
  }
};
