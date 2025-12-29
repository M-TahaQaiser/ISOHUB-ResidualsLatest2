// src/components/aftercare/ContentList/ContentList.component.js
import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  useTheme,
} from '@mui/material';

const ContentList = ({ items, ordered = false, icon = null, typographyProps = {} }) => {
  const theme = useTheme();
  const ListComponent = ordered ? 'ol' : 'ul';

  return (
    <List
      component={ListComponent}
      sx={{
        pl: ordered ? 3 : 0,
        listStyle: ordered ? 'decimal' : 'none',
        '& ol, & ul': { margin: 0, padding: 0 },
      }}
    >
      {items.map((item, index) => (
        <ListItem
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: icon ? 2 : 0,
            padding: 0,
          }}
        >
          {icon && (
            <ListItemIcon
              sx={{
                minWidth: 0,
                color: theme.palette.primary.main,
              }}
            >
              {React.cloneElement(icon, { fontSize: 'small' })}
            </ListItemIcon>
          )}
          <ListItemText
            primary={
              <Typography
                variant="body1"
                {...typographyProps}
                sx={{
                  ...typographyProps.sx,
                  color: theme.palette.text.primary,
                  margin: 0,
                }}
              >
                {item}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ContentList;
