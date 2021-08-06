UA Locations
=============

Data set which contains ukrainian locations



Data set contains structure with administrative-territorial units::

    #
    #
    #  - COUNTRY
    #       - CAPITAL_CITY
    #       - STATE
    #            - DISTRICT
    #            - COMMUNITY
    #                - CITY
    #                - URBAN
    #                - SETTLEMENT
    #                - VILLAGE
    #
    # !!! parent_id fieled helps to make a tree, stucture discribed above

Types translations to ukrainian::

    #  COUNTRY - країна [Україна]
    #  CAPITAL_CITY - столиця [Київ, Севастопіль]
    #  STATE - область
    #  DISTRICT - район
    #  COMMUNITY - громада
    #  CITY - місто
    #  URBAN - село міського типу
    #  SETTLEMENT - селище
    #  VILLAGE - село


Need to improve!:
^^^^^^^^^^^^^^^^^^
    #  Add russian translations for rows with COMMUNITY type

    #  Moderate russian translations (name, public_name) for rows with CITY, URBAN, SETTLEMENT, VILLAGE types

    #  Moderate, set post_code for rows with CITY, URBAN, SETTLEMENT, VILLAGE types