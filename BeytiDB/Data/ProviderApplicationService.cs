using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("ProviderApplicationService")]
[Index("ProviderApplicationId", Name = "IX_PAS_App")]
[Index("ServiceCatalogId", Name = "IX_PAS_Catalog")]
public partial class ProviderApplicationService
{
    [Key]
    public int Id { get; set; }

    public int ProviderApplicationId { get; set; }

    public int ServiceCatalogId { get; set; }

    [ForeignKey("ProviderApplicationId")]
    [InverseProperty("ProviderApplicationServices")]
    public virtual ProviderApplication ProviderApplication { get; set; } = null!;

    [ForeignKey("ServiceCatalogId")]
    [InverseProperty("ProviderApplicationServices")]
    public virtual ServiceCatalog ServiceCatalog { get; set; } = null!;
}
