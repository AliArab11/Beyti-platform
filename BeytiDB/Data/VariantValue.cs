using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("VariantValue")]
[Index("VariantOptionId", Name = "IX_VariantValue_Option")]
public partial class VariantValue
{
    [Key]
    public int Id { get; set; }

    public int VariantOptionId { get; set; }

    [StringLength(60)]
    public string ValueName { get; set; } = null!;

    [InverseProperty("ColorValue")]
    public virtual ICollection<ProductVariant> ProductVariantColorValues { get; set; } = new List<ProductVariant>();

    [InverseProperty("SizeValue")]
    public virtual ICollection<ProductVariant> ProductVariantSizeValues { get; set; } = new List<ProductVariant>();

    [ForeignKey("VariantOptionId")]
    [InverseProperty("VariantValues")]
    public virtual VariantOption VariantOption { get; set; } = null!;
}
